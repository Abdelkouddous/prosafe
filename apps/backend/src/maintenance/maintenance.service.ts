import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { DataSource, Repository } from 'typeorm';
import { Maintenance } from './entities/maintenance.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { InventoryCondition } from '../inventory/enums/inventory-condition.enum';
import { MaintenanceResult, MaintenanceStatus } from './enums/maintenance.enums';
import { CompleteMaintenanceDto, CreateMaintenanceDto, ListMaintenanceQueryDto, UpdateMaintenanceDto } from './dto/maintenance.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { MANAGER_ROLES } from '../users/enums/role.enum';

/** Maintenance due within this many days triggers a manager notification. */
export const MAINTENANCE_DUE_DAYS = 7;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectRepository(Maintenance) private readonly repo: Repository<Maintenance>,
    @InjectRepository(InventoryItem) private readonly itemRepo: Repository<InventoryItem>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  private baseQuery() {
    return this.repo
      .createQueryBuilder('m')
      .leftJoin('m.item', 'item')
      .addSelect(['item.id', 'item.name', 'item.category', 'item.location', 'item.condition'])
      .leftJoin('m.performedBy', 'performedBy')
      .addSelect(['performedBy.id', 'performedBy.firstName', 'performedBy.lastName']);
  }

  async list(q: ListMaintenanceQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.baseQuery();
    if (q.itemId) qb.andWhere('m.itemId = :itemId', { itemId: q.itemId });
    if (q.status) qb.andWhere('m.status = :status', { status: q.status });
    if (q.from) qb.andWhere('m.scheduledAt >= :from', { from: new Date(q.from) });
    if (q.to) {
      const to = new Date(q.to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.to)) to.setUTCHours(23, 59, 59, 999);
      qb.andWhere('m.scheduledAt <= :to', { to });
    }
    if (q.status === MaintenanceStatus.DONE) qb.orderBy('m.doneAt', 'DESC', 'NULLS LAST');
    else qb.orderBy('m.scheduledAt', 'ASC');
    qb.addOrderBy('m.id', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Maintenance> {
    const m = await this.baseQuery().where('m.id = :id', { id }).getOne();
    if (!m) throw new NotFoundException('Maintenance not found');
    return m;
  }

  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId }, select: ['id'] });
    if (!item) throw new NotFoundException('Inventory item not found');
    const saved = await this.repo.save(
      this.repo.create({
        itemId: dto.itemId,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes ?? null,
        status: MaintenanceStatus.PLANNED,
      }),
    );
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateMaintenanceDto): Promise<Maintenance> {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Maintenance not found');
    if (m.status === MaintenanceStatus.DONE) throw new ConflictException('A completed maintenance cannot be modified');
    if (dto.type) m.type = dto.type;
    if (dto.notes !== undefined) m.notes = dto.notes;
    if (dto.scheduledAt) m.scheduledAt = new Date(dto.scheduledAt);
    if (dto.status) m.status = dto.status;
    // re-planning an overdue maintenance in the future puts it back to planned
    if (!dto.status && dto.scheduledAt && m.status === MaintenanceStatus.OVERDUE && m.scheduledAt > new Date()) {
      m.status = MaintenanceStatus.PLANNED;
    }
    await this.repo.save(m);
    return this.findOne(id);
  }

  /**
   * Marks a maintenance as done and propagates to the item:
   * lastInspectionAt = doneAt, nextInspectionAt = nextScheduledAt (new planned maintenance) or the
   * earliest remaining planned one, condition (failed -> non_functional, ok -> functional, issues -> unchanged).
   */
  async complete(id: number, dto: CompleteMaintenanceDto, performerId: number): Promise<Maintenance> {
    const doneAt = dto.doneAt ? new Date(dto.doneAt) : new Date();
    if (dto.nextScheduledAt && new Date(dto.nextScheduledAt) <= doneAt) {
      throw new BadRequestException('nextScheduledAt must be after the completion date');
    }

    await this.dataSource.transaction(async (manager) => {
      const m = await manager.findOne(Maintenance, { where: { id } });
      if (!m) throw new NotFoundException('Maintenance not found');
      if (m.status === MaintenanceStatus.DONE || m.status === MaintenanceStatus.CANCELLED) {
        throw new ConflictException(`Maintenance is already ${m.status}`);
      }
      const item = await manager.findOne(InventoryItem, { where: { id: m.itemId } });
      if (!item) throw new NotFoundException('Inventory item not found');

      m.status = MaintenanceStatus.DONE;
      m.doneAt = doneAt;
      m.performedById = performerId;
      m.result = dto.result;
      if (dto.notes !== undefined) m.notes = dto.notes;
      await manager.save(Maintenance, m);

      let next: Date | null = null;
      if (dto.nextScheduledAt) {
        next = new Date(dto.nextScheduledAt);
        await manager.save(
          Maintenance,
          manager.create(Maintenance, { itemId: m.itemId, type: m.type, scheduledAt: next, status: MaintenanceStatus.PLANNED }),
        );
      } else {
        const upcoming = await manager
          .createQueryBuilder(Maintenance, 'x')
          .where('x.itemId = :itemId AND x.status IN (:...st) AND x.id != :id', {
            itemId: m.itemId,
            st: [MaintenanceStatus.PLANNED, MaintenanceStatus.OVERDUE],
            id: m.id,
          })
          .orderBy('x.scheduledAt', 'ASC')
          .getOne();
        next = upcoming?.scheduledAt ?? null;
      }

      item.lastInspectionAt = doneAt;
      item.nextInspectionAt = next;
      if (dto.result === MaintenanceResult.FAILED) item.condition = InventoryCondition.NON_FUNCTIONAL;
      else if (dto.result === MaintenanceResult.OK) item.condition = InventoryCondition.FUNCTIONAL;
      await manager.save(InventoryItem, item);
    });
    return this.findOne(id);
  }

  // ---------- Scheduled job (daily 07:00 Africa/Algiers) ----------

  @Cron('0 7 * * *', { name: 'maintenance-daily-checks', timeZone: 'Africa/Algiers' })
  async runDailyChecks(now = new Date()): Promise<{ overdue: number; dueSoon: number }> {
    try {
      const overdue = await this.markOverdue(now);
      const dueSoon = await this.notifyDueSoon(now);
      return { overdue, dueSoon };
    } catch (err) {
      this.logger.error(`maintenance daily checks failed: ${(err as Error).message}`);
      return { overdue: 0, dueSoon: 0 };
    }
  }

  /** Planned maintenances whose date is past become `overdue` and managers are notified (deduplicated). */
  async markOverdue(now = new Date()): Promise<number> {
    const late = await this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.item', 'item')
      .where('m.status = :planned AND m.scheduledAt < :now', { planned: MaintenanceStatus.PLANNED, now })
      .getMany();
    for (const m of late) {
      m.status = MaintenanceStatus.OVERDUE;
      await this.repo.save(m);
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, {
        type: NotificationType.MAINTENANCE,
        title: 'Maintenance en retard',
        body: `La maintenance (${m.type}) de ${m.item?.name ?? `l'equipement #${m.itemId}`} etait prevue le ${m.scheduledAt.toISOString().slice(0, 10)}.`,
        data: { key: `maintenance-overdue:${m.id}`, maintenanceId: m.id, itemId: m.itemId },
        priority: 'high',
      });
    }
    return late.length;
  }

  /** Planned maintenances due within 7 days. */
  async notifyDueSoon(now = new Date()): Promise<number> {
    const limit = new Date(now.getTime() + MAINTENANCE_DUE_DAYS * 86_400_000);
    const due = await this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.item', 'item')
      .where('m.status = :planned AND m.scheduledAt >= :now AND m.scheduledAt <= :limit', {
        planned: MaintenanceStatus.PLANNED,
        now,
        limit,
      })
      .getMany();
    for (const m of due) {
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, {
        type: NotificationType.MAINTENANCE,
        title: 'Maintenance a venir',
        body: `Maintenance (${m.type}) de ${m.item?.name ?? `l'equipement #${m.itemId}`} prevue le ${m.scheduledAt.toISOString().slice(0, 10)}.`,
        data: { key: `maintenance-due:${m.id}`, maintenanceId: m.id, itemId: m.itemId },
      });
    }
    return due.length;
  }
}
