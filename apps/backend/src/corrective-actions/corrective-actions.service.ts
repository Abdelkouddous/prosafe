import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Audit } from '../audits/entities/audit.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { Risk } from '../risks/entities/risk.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { User } from '../users/entities/user.entity';
import { MANAGER_ROLES, Role } from '../users/enums/role.enum';
import { CreateCorrectiveActionDto, ListCorrectiveActionsQueryDto, UpdateCorrectiveActionDto } from './dto/corrective-action.dto';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { CorrectiveActionSource, CorrectiveActionStatus } from './enums/corrective-action.enums';

export interface Actor {
  id: number;
  roles?: Role[];
}

const isManager = (a: Actor) => MANAGER_ROLES.some((r) => a.roles?.includes(r));
const OPEN_STATUSES = [CorrectiveActionStatus.TODO, CorrectiveActionStatus.IN_PROGRESS];
const USER_FIELDS = ['id', 'firstName', 'lastName'];

@Injectable()
export class CorrectiveActionsService {
  private readonly logger = new Logger(CorrectiveActionsService.name);

  constructor(
    @InjectRepository(CorrectiveAction) private readonly repo: Repository<CorrectiveAction>,
    @InjectRepository(Incident) private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(Risk) private readonly riskRepo: Repository<Risk>,
    @InjectRepository(Audit) private readonly auditRepo: Repository<Audit>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateCorrectiveActionDto, actor: Actor): Promise<CorrectiveAction> {
    if (dto.sourceType === CorrectiveActionSource.INCIDENT) {
      const exists = await this.incidentRepo.count({ where: { id: dto.sourceId } });
      if (!exists) throw new NotFoundException('Incident not found');
    } else if (dto.sourceType === CorrectiveActionSource.RISK) {
      if (!(await this.riskRepo.count({ where: { id: dto.sourceId } }))) throw new NotFoundException('Risk not found');
    } else if (dto.sourceType === CorrectiveActionSource.AUDIT) {
      if (!(await this.auditRepo.count({ where: { id: dto.sourceId } }))) throw new NotFoundException('Audit not found');
    }
    if (dto.ownerId !== undefined) await this.assertValidOwner(dto.ownerId);

    const saved = await this.repo.save(
      this.repo.create({
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        title: dto.title,
        description: dto.description ?? null,
        ownerId: dto.ownerId ?? null,
        dueDate: dto.dueDate ?? null,
        status: CorrectiveActionStatus.TODO,
        createdById: actor.id,
      }),
    );
    if (saved.ownerId) await this.notifyAssigned(saved);
    return saved;
  }

  async findAll(q: ListCorrectiveActionsQueryDto, actor: Actor) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoin('a.owner', 'owner')
      .addSelect(USER_FIELDS.map((f) => `owner.${f}`))
      .orderBy('a.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('a.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (!isManager(actor)) qb.andWhere('a.ownerId = :me', { me: actor.id });
    else if (q.ownerId !== undefined) qb.andWhere('a.ownerId = :owner', { owner: q.ownerId });
    if (q.sourceType) qb.andWhere('a.sourceType = :st', { st: q.sourceType });
    if (q.sourceId !== undefined) qb.andWhere('a.sourceId = :sid', { sid: q.sourceId });
    if (q.status) qb.andWhere('a.status = :status', { status: q.status });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number, actor: Actor): Promise<CorrectiveAction> {
    const action = await this.repo.findOne({ where: { id }, relations: ['owner'] });
    // 404 (not 403) for employees on actions they do not own, to avoid leaking existence
    if (!action || (!isManager(actor) && action.ownerId !== actor.id)) throw new NotFoundException('Corrective action not found');
    return action;
  }

  /** Managers may change anything; the owner may only change `status`. */
  async update(id: number, dto: UpdateCorrectiveActionDto, actor: Actor): Promise<CorrectiveAction> {
    const action = await this.findOne(id, actor);
    const manager = isManager(actor);
    if (!manager) {
      const forbidden = Object.keys(dto).filter((k) => k !== 'status' && (dto as any)[k] !== undefined);
      if (forbidden.length) throw new ForbiddenException('Only status can be updated by the action owner');
    }

    const previousOwner = action.ownerId;
    if (dto.ownerId !== undefined && dto.ownerId !== previousOwner) await this.assertValidOwner(dto.ownerId);
    if (dto.title !== undefined) action.title = dto.title;
    if (dto.description !== undefined) action.description = dto.description;
    if (dto.ownerId !== undefined) action.ownerId = dto.ownerId;
    if (dto.dueDate !== undefined) action.dueDate = dto.dueDate;
    if (dto.status !== undefined && dto.status !== action.status) {
      action.status = dto.status;
      action.doneAt = dto.status === CorrectiveActionStatus.DONE ? new Date() : null;
    }
    const saved = await this.repo.save(action);
    if (saved.ownerId && saved.ownerId !== previousOwner) await this.notifyAssigned(saved);
    return saved;
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Corrective action not found');
  }

  /** Actions of one source, used by incident detail. */
  findBySource(sourceType: CorrectiveActionSource, sourceId: number): Promise<CorrectiveAction[]> {
    return this.repo
      .createQueryBuilder('a')
      .leftJoin('a.owner', 'owner')
      .addSelect(USER_FIELDS.map((f) => `owner.${f}`))
      .where('a.sourceType = :sourceType AND a.sourceId = :sourceId', { sourceType, sourceId })
      .orderBy('a.id', 'ASC')
      .getMany();
  }

  countOverdue(now = new Date()): Promise<number> {
    return this.repo.count({ where: { status: In(OPEN_STATUSES), dueDate: LessThan(now) } });
  }

  // ---------- Scheduled job (daily 07:30 Africa/Algiers) ----------

  @Cron('30 7 * * *', { name: 'corrective-actions-overdue', timeZone: 'Africa/Algiers' })
  async runDailyChecks(now = new Date()): Promise<{ overdue: number }> {
    try {
      return { overdue: await this.notifyOverdue(now) };
    } catch (err) {
      this.logger.error(`overdue check failed: ${(err as Error).message}`);
      return { overdue: 0 };
    }
  }

  /** Overdue open actions -> owner + managers, once per action per 24h. Returns the number of overdue actions. */
  async notifyOverdue(now: Date): Promise<number> {
    const overdue = await this.repo.find({ where: { status: In(OPEN_STATUSES), dueDate: LessThan(now) } });
    for (const a of overdue) {
      const payload = {
        type: NotificationType.ALERT,
        title: 'Action corrective en retard',
        body: `${a.title} (échéance ${a.dueDate.toISOString().slice(0, 10)})`,
        data: { key: `corrective-overdue:${a.id}`, correctiveActionId: a.id, sourceType: a.sourceType, sourceId: a.sourceId },
      };
      if (a.ownerId) await this.notifications.notifyUsersOnce([a.ownerId], payload);
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, payload);
    }
    return overdue.length;
  }

  // ---------- helpers ----------

  private async assertValidOwner(ownerId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: ownerId }, select: ['id', 'roles', 'isActive'] });
    if (!user || !user.isActive || !user.roles?.length || user.roles.includes(Role.PENDING)) {
      throw new BadRequestException('ownerId must reference an active user');
    }
  }

  private notifyAssigned(a: CorrectiveAction) {
    return this.notifications.notifyUsers([a.ownerId], {
      type: NotificationType.INCIDENT,
      title: 'Action corrective assignée',
      body: a.title.slice(0, 200),
      data: { correctiveActionId: a.id, sourceType: a.sourceType, sourceId: a.sourceId },
    });
  }
}
