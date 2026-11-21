import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/enums/alert-severity.enum';
import { AlertType } from '../alerts/enums/alert-type.enum';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../users/enums/role.enum';
import {
  CreateDrillDto, CreateScenarioDto, ListDrillsQueryDto, ListEventsQueryDto, ListScenariosQueryDto, TriggerEmergencyDto, UpdateDrillDto,
  UpdateScenarioDto,
} from './dto/emergency.dto';
import { Drill } from './entities/drill.entity';
import { EmergencyEvent } from './entities/emergency-event.entity';
import { EmergencyScenario } from './entities/emergency-scenario.entity';

/** Everybody (any non-pending role) receives emergency notifications. */
export const EMERGENCY_ROLES = [Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE];

interface Actor {
  id: number;
  roles?: Role[];
}

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  constructor(
    @InjectRepository(EmergencyScenario) private readonly scenarioRepo: Repository<EmergencyScenario>,
    @InjectRepository(EmergencyEvent) private readonly eventRepo: Repository<EmergencyEvent>,
    @InjectRepository(Drill) private readonly drillRepo: Repository<Drill>,
    private readonly notifications: NotificationsService,
    private readonly alerts: AlertsService,
  ) {}

  // ---------- Scenarios ----------

  async listScenarios(q: ListScenariosQueryDto, actor: Actor) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const manager = actor.roles?.some((r) => r === Role.ADMIN || r === Role.SST_MANAGER);
    const qb = this.scenarioRepo
      .createQueryBuilder('s')
      .orderBy('s.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (!manager) qb.andWhere('s.isActive = true');
    else if (q.active !== undefined) qb.andWhere('s.isActive = :active', { active: q.active });
    if (q.type) qb.andWhere('s.type = :type', { type: q.type });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getScenario(id: number, actor?: Actor): Promise<EmergencyScenario> {
    const s = await this.scenarioRepo.findOne({ where: { id } });
    const manager = actor?.roles?.some((r) => r === Role.ADMIN || r === Role.SST_MANAGER);
    if (!s || (actor && !manager && !s.isActive)) throw new NotFoundException('Scenario not found');
    return s;
  }

  createScenario(dto: CreateScenarioDto): Promise<EmergencyScenario> {
    return this.scenarioRepo.save(
      this.scenarioRepo.create({
        title: dto.title,
        type: dto.type,
        steps: dto.steps,
        contacts: dto.contacts ?? [],
        assemblyPoint: dto.assemblyPoint ?? null,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async updateScenario(id: number, dto: UpdateScenarioDto): Promise<EmergencyScenario> {
    const s = await this.getScenario(id);
    Object.assign(s, Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)));
    return this.scenarioRepo.save(s);
  }

  async removeScenario(id: number): Promise<void> {
    const res = await this.scenarioRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Scenario not found');
  }

  // ---------- Events ----------

  /**
   * Manual trigger: stores the event, raises an `emergency` alert and notifies EVERY user
   * (admin, sst_manager, employee) with a high-priority `emergency` notification (push channel "emergency").
   */
  async trigger(dto: TriggerEmergencyDto, actor: Actor): Promise<EmergencyEvent> {
    let scenario: EmergencyScenario | null = null;
    if (dto.scenarioId !== undefined) {
      scenario = await this.scenarioRepo.findOne({ where: { id: dto.scenarioId } });
      if (!scenario) throw new NotFoundException('Scenario not found');
      if (!scenario.isActive) throw new BadRequestException('Scenario is not active');
    }
    const event = await this.eventRepo.save(
      this.eventRepo.create({ scenarioId: scenario?.id ?? null, message: dto.message, zone: dto.zone ?? null, triggeredById: actor.id, active: true }),
    );

    try {
      const alert = await this.alerts.create({
        title: `URGENCE${scenario ? ` : ${scenario.title}` : ''}`,
        description: `${dto.message}${dto.zone ? ` (zone : ${dto.zone})` : ''}`,
        severity: AlertSeverity.CRITICAL,
        type: AlertType.EMERGENCY,
        metadata: { eventId: event.id, scenarioId: scenario?.id ?? null, zone: dto.zone ?? null },
      });
      event.alertId = alert.id;
      await this.eventRepo.save(event);
    } catch (err) {
      this.logger.error(`emergency alert for event ${event.id} failed: ${(err as Error).message}`);
    }

    await this.notifications.notifyRoles(EMERGENCY_ROLES, {
      type: NotificationType.EMERGENCY,
      title: `URGENCE${scenario ? ` : ${scenario.title}` : ''}`,
      body: `${dto.message}${dto.zone ? ` — ${dto.zone}` : ''}`.slice(0, 300),
      data: { eventId: event.id, scenarioId: scenario?.id ?? null, zone: dto.zone ?? null },
      priority: 'high',
    });
    return { ...event, scenario } as EmergencyEvent;
  }

  async listEvents(q: ListEventsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.scenario', 'scenario')
      .leftJoin('e.triggeredBy', 'u')
      .addSelect(['u.id', 'u.firstName', 'u.lastName'])
      .orderBy('e.triggeredAt', 'DESC')
      .addOrderBy('e.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (q.active !== undefined) qb.andWhere('e.active = :active', { active: q.active });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async closeEvent(id: number, actor: Actor): Promise<EmergencyEvent> {
    const event = await this.eventRepo.findOne({ where: { id }, relations: ['scenario'] });
    if (!event) throw new NotFoundException('Emergency event not found');
    if (!event.active) throw new BadRequestException('Emergency event is already closed');
    event.active = false;
    event.closedAt = new Date();
    event.closedById = actor.id;
    const saved = await this.eventRepo.save(event);
    await this.notifications.notifyRoles(EMERGENCY_ROLES, {
      type: NotificationType.EMERGENCY,
      title: 'Fin de l\'alerte',
      body: `${event.message}${event.zone ? ` — ${event.zone}` : ''}`.slice(0, 300),
      data: { eventId: event.id, closed: true },
    });
    return saved;
  }

  // ---------- Drills ----------

  async createDrill(dto: CreateDrillDto, actor: Actor): Promise<Drill> {
    if (dto.scenarioId !== undefined) await this.getScenario(dto.scenarioId);
    return this.drillRepo.save(
      this.drillRepo.create({ scenarioId: dto.scenarioId ?? null, scheduledAt: dto.scheduledAt, zone: dto.zone ?? null, createdById: actor.id }),
    );
  }

  async listDrills(q: ListDrillsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.drillRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.scenario', 'scenario')
      .orderBy('d.scheduledAt', 'DESC')
      .addOrderBy('d.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (q.status) qb.andWhere('d.status = :status', { status: q.status });
    if (q.from) qb.andWhere('d.scheduledAt >= :from', { from: q.from });
    if (q.to) qb.andWhere('d.scheduledAt <= :to', { to: q.to });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async getDrill(id: number): Promise<Drill> {
    const d = await this.drillRepo.findOne({ where: { id }, relations: ['scenario'] });
    if (!d) throw new NotFoundException('Drill not found');
    return d;
  }

  async updateDrill(id: number, dto: UpdateDrillDto): Promise<Drill> {
    const d = await this.getDrill(id);
    if (dto.scenarioId !== undefined && dto.scenarioId !== d.scenarioId) await this.getScenario(dto.scenarioId);
    const { scenarioId, ...rest } = dto;
    Object.assign(d, Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)));
    if (scenarioId !== undefined) d.scenarioId = scenarioId;
    delete (d as any).scenario;
    if (
      d.participantsCount !== null && d.evacuatedCount !== null && d.evacuatedCount > d.participantsCount
    ) {
      throw new BadRequestException('evacuatedCount cannot exceed participantsCount');
    }
    await this.drillRepo.save(d);
    return this.getDrill(id);
  }

  async removeDrill(id: number): Promise<void> {
    const res = await this.drillRepo.delete(id);
    if (!res.affected) throw new NotFoundException('Drill not found');
  }
}
