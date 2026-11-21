import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { MANAGER_ROLES, Role } from '../users/enums/role.enum';
import { CreateActionPlanDto, ListActionPlansQueryDto, UpdateActionPlanDto } from './dto/risk.dto';
import { ActionPlan } from './entities/action-plan.entity';
import { Risk } from './entities/risk.entity';
import { ActionPlanStatus } from './enums/risk.enums';

const OPEN = [ActionPlanStatus.PLANNED, ActionPlanStatus.IN_PROGRESS];
const OWNER_FIELDS = ['owner.id', 'owner.firstName', 'owner.lastName'];

@Injectable()
export class ActionPlansService {
  private readonly logger = new Logger(ActionPlansService.name);

  constructor(
    @InjectRepository(ActionPlan) private readonly repo: Repository<ActionPlan>,
    @InjectRepository(Risk) private readonly riskRepo: Repository<Risk>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateActionPlanDto): Promise<ActionPlan> {
    if (!(await this.riskRepo.count({ where: { id: dto.riskId } }))) throw new NotFoundException('Risk not found');
    if (dto.ownerId !== undefined) await this.assertValidOwner(dto.ownerId);
    const status = dto.status ?? ActionPlanStatus.PLANNED;
    const saved = await this.repo.save(
      this.repo.create({
        riskId: dto.riskId,
        title: dto.title,
        description: dto.description ?? null,
        ownerId: dto.ownerId ?? null,
        dueDate: dto.dueDate ?? null,
        status,
        progress: this.progressFor(status, dto.progress),
      }),
    );
    if (saved.ownerId) await this.notifyAssigned(saved);
    return saved;
  }

  async findAll(q: ListActionPlansQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoin('p.owner', 'owner')
      .addSelect(OWNER_FIELDS)
      .orderBy('p.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('p.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (q.riskId !== undefined) qb.andWhere('p.riskId = :riskId', { riskId: q.riskId });
    if (q.status) qb.andWhere('p.status = :status', { status: q.status });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<ActionPlan> {
    const plan = await this.repo
      .createQueryBuilder('p')
      .leftJoin('p.owner', 'owner')
      .addSelect(OWNER_FIELDS)
      .where('p.id = :id', { id })
      .getOne();
    if (!plan) throw new NotFoundException('Action plan not found');
    return plan;
  }

  async update(id: number, dto: UpdateActionPlanDto): Promise<ActionPlan> {
    const plan = await this.findOne(id);
    const previousOwner = plan.ownerId;
    if (dto.ownerId !== undefined && dto.ownerId !== previousOwner) await this.assertValidOwner(dto.ownerId);
    if (dto.title !== undefined) plan.title = dto.title;
    if (dto.description !== undefined) plan.description = dto.description;
    if (dto.ownerId !== undefined) plan.ownerId = dto.ownerId;
    if (dto.dueDate !== undefined) plan.dueDate = dto.dueDate;
    if (dto.status !== undefined) plan.status = dto.status;
    if (dto.progress !== undefined || dto.status !== undefined) plan.progress = this.progressFor(plan.status, dto.progress ?? plan.progress);
    delete (plan as any).owner;
    const saved = await this.repo.save(plan);
    if (saved.ownerId && saved.ownerId !== previousOwner) await this.notifyAssigned(saved);
    return saved;
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Action plan not found');
  }

  /** completed / validated plans are 100%. */
  private progressFor(status: ActionPlanStatus, progress?: number): number {
    if (status === ActionPlanStatus.COMPLETED || status === ActionPlanStatus.VALIDATED) return 100;
    return Math.min(100, Math.max(0, progress ?? 0));
  }

  // ---------- Scheduled job (daily 07:45 Africa/Algiers) ----------

  @Cron('45 7 * * *', { name: 'action-plans-overdue', timeZone: 'Africa/Algiers' })
  async runDailyChecks(now = new Date()): Promise<{ overdue: number }> {
    try {
      return { overdue: await this.notifyOverdue(now) };
    } catch (err) {
      this.logger.error(`action plan overdue check failed: ${(err as Error).message}`);
      return { overdue: 0 };
    }
  }

  /** Overdue open plans -> owner + managers, once per plan per 24h. Returns the number of overdue plans. */
  async notifyOverdue(now: Date): Promise<number> {
    const overdue = await this.repo.find({ where: { status: In(OPEN), dueDate: LessThan(now) } });
    for (const p of overdue) {
      const payload = {
        type: NotificationType.ALERT,
        title: 'Plan d\'action en retard',
        body: `${p.title} (échéance ${p.dueDate.toISOString().slice(0, 10)})`,
        data: { key: `action-plan-overdue:${p.id}`, actionPlanId: p.id, riskId: p.riskId },
      };
      if (p.ownerId) await this.notifications.notifyUsersOnce([p.ownerId], payload);
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, payload);
    }
    return overdue.length;
  }

  private async assertValidOwner(ownerId: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: ownerId }, select: ['id', 'roles', 'isActive'] });
    if (!user || !user.isActive || !user.roles?.length || user.roles.includes(Role.PENDING)) {
      throw new BadRequestException('ownerId must reference an active user');
    }
  }

  private notifyAssigned(p: ActionPlan) {
    return this.notifications.notifyUsers([p.ownerId], {
      type: NotificationType.ALERT,
      title: 'Plan d\'action assigné',
      body: p.title.slice(0, 200),
      data: { actionPlanId: p.id, riskId: p.riskId },
    });
  }
}
