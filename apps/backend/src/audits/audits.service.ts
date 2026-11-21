import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/enums/alert-severity.enum';
import { AlertType } from '../alerts/enums/alert-type.enum';
import { CorrectiveAction } from '../corrective-actions/entities/corrective-action.entity';
import { CorrectiveActionsService } from '../corrective-actions/corrective-actions.service';
import { CorrectiveActionSource } from '../corrective-actions/enums/corrective-action.enums';
import { StoredFile } from '../files/entities/stored-file.entity';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';
import { MANAGER_ROLES, Role } from '../users/enums/role.enum';
import { summarizeResponses } from './audit-score';
import {
  CreateAuditDto, CreateChecklistTemplateDto, ListAuditsQueryDto, SubmitAuditResponsesDto, UpdateAuditDto,
} from './dto/audit.dto';
import { AuditResponse } from './entities/audit-response.entity';
import { Audit } from './entities/audit.entity';
import { ChecklistItem, ChecklistTemplate } from './entities/checklist-template.entity';
import { AuditResult, AuditStatus } from './enums/audit.enums';

const DAY = 24 * 60 * 60 * 1000;
/** A completed audit below this compliance percentage raises a `compliance` alert. */
export const LOW_COMPLIANCE_THRESHOLD = 70;
const REMINDER_DAYS = [7, 1];

interface Actor {
  id: number;
}

@Injectable()
export class AuditsService {
  private readonly logger = new Logger(AuditsService.name);

  constructor(
    @InjectRepository(Audit) private readonly repo: Repository<Audit>,
    @InjectRepository(ChecklistTemplate) private readonly templateRepo: Repository<ChecklistTemplate>,
    @InjectRepository(AuditResponse) private readonly responseRepo: Repository<AuditResponse>,
    @InjectRepository(CorrectiveAction) private readonly caRepo: Repository<CorrectiveAction>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StoredFile) private readonly fileRepo: Repository<StoredFile>,
    private readonly correctiveActions: CorrectiveActionsService,
    private readonly notifications: NotificationsService,
    private readonly alerts: AlertsService,
  ) {}

  // ---------- Templates ----------

  listTemplates(): Promise<ChecklistTemplate[]> {
    return this.templateRepo.find({ order: { name: 'ASC', id: 'ASC' } });
  }

  async getTemplate(id: number): Promise<ChecklistTemplate> {
    const t = await this.templateRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Checklist template not found');
    return t;
  }

  createTemplate(dto: CreateChecklistTemplateDto, actor: Actor): Promise<ChecklistTemplate> {
    const items: ChecklistItem[] = dto.items.map((it, i) => ({ id: i + 1, clause: it.clause, question: it.question }));
    return this.templateRepo.save(this.templateRepo.create({ name: dto.name, standard: dto.standard, items, createdById: actor.id }));
  }

  // ---------- Audits ----------

  async create(dto: CreateAuditDto, actor: Actor): Promise<Audit> {
    const template = await this.getTemplate(dto.templateId);
    if (dto.auditorId !== undefined) await this.assertValidUser(dto.auditorId, 'auditorId');
    return this.repo.save(
      this.repo.create({
        title: dto.title,
        type: dto.type,
        standard: dto.standard ?? template.standard,
        scheduledAt: dto.scheduledAt,
        auditorName: dto.auditorName ?? null,
        auditorId: dto.auditorId ?? null,
        zone: dto.zone ?? null,
        templateId: template.id,
        status: AuditStatus.PLANNED,
        createdById: actor.id,
      }),
    );
  }

  async findAll(q: ListAuditsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoin('a.auditor', 'auditor')
      .addSelect(['auditor.id', 'auditor.firstName', 'auditor.lastName'])
      .orderBy('a.scheduledAt', 'ASC')
      .addOrderBy('a.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (q.from) qb.andWhere('a.scheduledAt >= :from', { from: new Date(q.from) });
    if (q.to) {
      const to = new Date(q.to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.to)) {
        to.setUTCDate(to.getUTCDate() + 1);
        qb.andWhere('a.scheduledAt < :to', { to });
      } else qb.andWhere('a.scheduledAt <= :to', { to });
    }
    if (q.status) qb.andWhere('a.status = :status', { status: q.status });
    if (q.type) qb.andWhere('a.type = :type', { type: q.type });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /** Audit + template (items) + responses + summary + corrective actions. */
  async findOne(id: number) {
    const audit = await this.repo
      .createQueryBuilder('a')
      .leftJoin('a.auditor', 'auditor')
      .addSelect(['auditor.id', 'auditor.firstName', 'auditor.lastName'])
      .where('a.id = :id', { id })
      .getOne();
    if (!audit) throw new NotFoundException('Audit not found');
    const template = audit.templateId ? await this.templateRepo.findOne({ where: { id: audit.templateId } }) : null;
    const responses = await this.responseRepo.find({ where: { auditId: id }, order: { itemId: 'ASC' }, relations: ['evidenceFile'] });
    const correctiveActions = await this.correctiveActions.findBySource(CorrectiveActionSource.AUDIT, id);
    const summary = summarizeResponses(responses.map((r) => r.result), template?.items.length ?? 0);
    return {
      ...audit,
      template,
      responses: responses.map((r) => ({
        ...r,
        evidenceFile: r.evidenceFile ? { id: r.evidenceFile.id, originalName: r.evidenceFile.originalName, mimeType: r.evidenceFile.mimeType } : null,
      })),
      summary,
      correctiveActions,
    };
  }

  async update(id: number, dto: UpdateAuditDto) {
    const audit = await this.repo.findOne({ where: { id } });
    if (!audit) throw new NotFoundException('Audit not found');
    if (dto.auditorId !== undefined && dto.auditorId !== audit.auditorId) await this.assertValidUser(dto.auditorId, 'auditorId');
    const previous = audit.status;
    for (const k of ['title', 'type', 'standard', 'scheduledAt', 'auditorName', 'auditorId', 'zone'] as const) {
      if (dto[k] !== undefined) (audit as any)[k] = dto[k];
    }
    if (dto.status !== undefined) audit.status = dto.status;
    if (audit.status === AuditStatus.COMPLETED && previous !== AuditStatus.COMPLETED) {
      audit.completedAt = new Date();
      const rows = await this.responseRepo.find({ where: { auditId: id } });
      audit.score = summarizeResponses(rows.map((r) => r.result), 0).score;
    } else if (audit.status !== AuditStatus.COMPLETED) audit.completedAt = null;
    const saved = await this.repo.save(audit);
    if (saved.status === AuditStatus.COMPLETED && previous !== AuditStatus.COMPLETED) await this.alertIfLowScore(saved);
    return this.findOne(saved.id);
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Audit not found');
    await this.caRepo.delete({ sourceType: CorrectiveActionSource.AUDIT, sourceId: id });
  }

  // ---------- Responses ----------

  /**
   * Upserts responses (one per template item), recomputes the audit score and moves a planned audit to in_progress.
   * With `createActions`, every non_conform response without a corrective action gets one (sourceType audit).
   */
  async submitResponses(id: number, dto: SubmitAuditResponsesDto, actor: Actor) {
    const audit = await this.repo.findOne({ where: { id } });
    if (!audit) throw new NotFoundException('Audit not found');
    if (audit.status === AuditStatus.CANCELLED) throw new BadRequestException('Audit is cancelled');
    const template = audit.templateId ? await this.getTemplate(audit.templateId) : null;
    const items = new Map((template?.items ?? []).map((i) => [i.id, i]));

    const byItem = new Map<number, (typeof dto.responses)[number]>();
    for (const r of dto.responses) {
      if (!items.has(r.itemId)) throw new BadRequestException(`Unknown checklist item: ${r.itemId}`);
      byItem.set(r.itemId, r);
    }
    const fileIds = [...new Set([...byItem.values()].map((r) => r.evidenceFileId).filter((f): f is number => f !== undefined))];
    if (fileIds.length && (await this.fileRepo.count({ where: { id: In(fileIds) } })) !== fileIds.length) {
      throw new BadRequestException('evidenceFileId references an unknown file');
    }
    if (dto.actionOwnerId !== undefined) await this.assertValidUser(dto.actionOwnerId, 'actionOwnerId');

    const existing = new Map((await this.responseRepo.find({ where: { auditId: id } })).map((r) => [r.itemId, r]));
    for (const r of byItem.values()) {
      const row = existing.get(r.itemId) ?? this.responseRepo.create({ auditId: id, itemId: r.itemId, correctiveActionId: null });
      row.result = r.result;
      row.comment = r.comment ?? null;
      row.evidenceFileId = r.evidenceFileId ?? null;
      existing.set(r.itemId, await this.responseRepo.save(row));
    }

    if (dto.createActions) {
      const due = dto.actionDueDate ?? new Date(Date.now() + 30 * DAY);
      for (const row of existing.values()) {
        if (row.result !== AuditResult.NON_CONFORM || row.correctiveActionId) continue;
        const item = items.get(row.itemId);
        const action = await this.correctiveActions.create(
          {
            sourceType: CorrectiveActionSource.AUDIT,
            sourceId: id,
            title: `Non-conformité ${item?.clause ?? ''} : ${item?.question ?? `item ${row.itemId}`}`.slice(0, 200),
            description: row.comment ?? undefined,
            ownerId: dto.actionOwnerId,
            dueDate: due,
          },
          actor,
        );
        row.correctiveActionId = action.id;
        await this.responseRepo.save(row);
      }
    }

    audit.score = summarizeResponses([...existing.values()].map((r) => r.result), items.size).score;
    if (audit.status === AuditStatus.PLANNED) audit.status = AuditStatus.IN_PROGRESS;
    await this.repo.save(audit);
    return this.findOne(id);
  }

  // ---------- Scheduled job (daily 07:15 Africa/Algiers) ----------

  @Cron('15 7 * * *', { name: 'audit-reminders', timeZone: 'Africa/Algiers' })
  async runDailyChecks(now = new Date()): Promise<{ reminders: number }> {
    try {
      return { reminders: await this.sendReminders(now) };
    } catch (err) {
      this.logger.error(`audit reminders failed: ${(err as Error).message}`);
      return { reminders: 0 };
    }
  }

  /**
   * Planned audits scheduled in 7 days or in 1 day (days = ceil((scheduledAt - now) / 1 day)) -> auditor + managers.
   * Deduped per audit and horizon. Returns the number of audits reminded.
   */
  async sendReminders(now: Date): Promise<number> {
    const upcoming = await this.repo.find({
      where: { status: AuditStatus.PLANNED, scheduledAt: Between(now, new Date(now.getTime() + 7 * DAY)) },
    });
    let count = 0;
    for (const a of upcoming) {
      const days = Math.ceil((a.scheduledAt.getTime() - now.getTime()) / DAY);
      if (!REMINDER_DAYS.includes(days)) continue;
      const payload = {
        type: NotificationType.AUDIT,
        title: days === 1 ? 'Audit demain' : `Audit dans ${days} jours`,
        body: `${a.title} — ${a.scheduledAt.toISOString().slice(0, 10)}`,
        data: { key: `audit-reminder:${a.id}:${days}`, auditId: a.id, daysLeft: days },
      };
      if (a.auditorId) await this.notifications.notifyUsersOnce([a.auditorId], payload, 48);
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, payload, 48);
      count++;
    }
    return count;
  }

  // ---------- helpers ----------

  private async alertIfLowScore(audit: Audit): Promise<void> {
    if (audit.score === null || audit.score >= LOW_COMPLIANCE_THRESHOLD) return;
    try {
      await this.alerts.create({
        title: `Audit non conforme : ${audit.title}`,
        description: `Score de conformité ${audit.score}% (seuil ${LOW_COMPLIANCE_THRESHOLD}%).`,
        severity: audit.score < 50 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        type: AlertType.COMPLIANCE,
        metadata: { auditId: audit.id, score: audit.score },
      });
      await this.notifications.notifyRoles(MANAGER_ROLES, {
        type: NotificationType.AUDIT,
        title: `Audit non conforme : ${audit.title}`.slice(0, 200),
        body: `Score ${audit.score}%`,
        data: { auditId: audit.id },
      });
    } catch (err) {
      this.logger.error(`low compliance alert for audit ${audit.id} failed: ${(err as Error).message}`);
    }
  }

  private async assertValidUser(userId: number, field: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'roles', 'isActive'] });
    if (!user || !user.isActive || !user.roles?.length || user.roles.includes(Role.PENDING)) {
      throw new BadRequestException(`${field} must reference an active user`);
    }
  }
}
