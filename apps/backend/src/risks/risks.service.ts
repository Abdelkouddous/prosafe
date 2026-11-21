import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/enums/alert-severity.enum';
import { AlertType } from '../alerts/enums/alert-type.enum';
import { CorrectiveAction } from '../corrective-actions/entities/corrective-action.entity';
import { CorrectiveActionsService } from '../corrective-actions/corrective-actions.service';
import { CorrectiveActionSource } from '../corrective-actions/enums/corrective-action.enums';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { MANAGER_ROLES, Role } from '../users/enums/role.enum';
import {
  CreateLmraDto, CreateRiskDto, EvaluateRiskDto, ListLmraQueryDto, ListRisksQueryDto, MatrixQueryDto, UpdateRiskDto,
} from './dto/risk.dto';
import { ActionPlan } from './entities/action-plan.entity';
import { LmraAssessment } from './entities/lmra-assessment.entity';
import { Risk } from './entities/risk.entity';
import { LmraDecision, RiskLevel, RiskStatus } from './enums/risk.enums';
import { buildRiskMatrix, computeRiskScore, riskLevelFromScore } from './risk-level';

export interface RiskActor {
  id: number;
  roles?: Role[];
}

export const isManagerActor = (a: RiskActor) => MANAGER_ROLES.some((r) => a.roles?.includes(r));
/** Statuses visible to every employee (catalogue); employees also see their own proposals. */
const PUBLIC_STATUSES = [RiskStatus.VALIDATED, RiskStatus.MITIGATED];
export const DEFAULT_LMRA_SCORE_INPUT = 3;

@Injectable()
export class RisksService {
  private readonly logger = new Logger(RisksService.name);

  constructor(
    @InjectRepository(Risk) private readonly repo: Repository<Risk>,
    @InjectRepository(ActionPlan) private readonly planRepo: Repository<ActionPlan>,
    @InjectRepository(LmraAssessment) private readonly lmraRepo: Repository<LmraAssessment>,
    @InjectRepository(CorrectiveAction) private readonly caRepo: Repository<CorrectiveAction>,
    private readonly notifications: NotificationsService,
    private readonly alerts: AlertsService,
    private readonly correctiveActions: CorrectiveActionsService,
  ) {}

  // ---------- CRUD ----------

  /** Managers create validated risks; employees create `proposed` ones and managers are notified. */
  async create(dto: CreateRiskDto, actor: RiskActor): Promise<Risk> {
    const manager = isManagerActor(actor);
    const gravity = dto.gravity ?? DEFAULT_LMRA_SCORE_INPUT;
    const probability = dto.probability ?? DEFAULT_LMRA_SCORE_INPUT;
    const score = computeRiskScore(gravity, probability);
    const saved = await this.repo.save(
      this.repo.create({
        title: dto.title,
        description: dto.description ?? null,
        hazardCategory: dto.hazardCategory,
        zone: dto.zone ?? null,
        department: dto.department ?? null,
        gravity,
        probability,
        score,
        level: riskLevelFromScore(score),
        recommendedMeasures: dto.recommendedMeasures ?? null,
        status: manager ? RiskStatus.VALIDATED : RiskStatus.PROPOSED,
        proposedById: actor.id,
        validatedById: manager ? actor.id : null,
      }),
    );
    if (saved.status === RiskStatus.PROPOSED) await this.notifyProposed([saved]);
    else await this.raiseIfCritical(saved);
    return saved;
  }

  async findAll(q: ListRisksQueryDto, actor: RiskActor) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('r')
      .orderBy('r.score', 'DESC')
      .addOrderBy('r.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    this.applyVisibility(qb, actor);
    if (q.status) qb.andWhere('r.status = :status', { status: q.status });
    if (q.level) qb.andWhere('r.level = :level', { level: q.level });
    if (q.zone) qb.andWhere('r.zone = :zone', { zone: q.zone });
    if (q.hazardCategory) qb.andWhere('r.hazardCategory = :hc', { hc: q.hazardCategory });
    if (q.search) qb.andWhere('(r.title ILIKE :s OR r.description ILIKE :s)', { s: `%${q.search.replace(/[%_]/g, '\\$&')}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /** Risk with its action plans (owner id + name) and the corrective actions attached to it. */
  async findOne(id: number, actor: RiskActor) {
    const risk = await this.repo.findOne({ where: { id } });
    if (!risk || !this.canSee(risk, actor)) throw new NotFoundException('Risk not found');
    const actionPlans = await this.planRepo
      .createQueryBuilder('p')
      .leftJoin('p.owner', 'owner')
      .addSelect(['owner.id', 'owner.firstName', 'owner.lastName'])
      .where('p.riskId = :id', { id })
      .orderBy('p.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('p.id', 'ASC')
      .getMany();
    const correctiveActions = isManagerActor(actor) ? await this.correctiveActions.findBySource(CorrectiveActionSource.RISK, id) : [];
    return { ...risk, actionPlans, correctiveActions };
  }

  async update(id: number, dto: UpdateRiskDto, actor: RiskActor): Promise<Risk> {
    const risk = await this.mustFind(id);
    const before = { status: risk.status, level: risk.level };
    for (const k of ['title', 'description', 'hazardCategory', 'zone', 'department', 'recommendedMeasures'] as const) {
      if (dto[k] !== undefined) (risk as any)[k] = dto[k];
    }
    if (dto.status !== undefined) {
      risk.status = dto.status;
      if (dto.status === RiskStatus.VALIDATED && before.status !== RiskStatus.VALIDATED) risk.validatedById = actor.id;
    }
    const saved = await this.repo.save(risk);
    await this.raiseIfCritical(saved, before);
    return saved;
  }

  /** Re-scores a risk (score = gravity x probability, level derived). */
  async evaluate(id: number, dto: EvaluateRiskDto): Promise<Risk> {
    const risk = await this.mustFind(id);
    const before = { status: risk.status, level: risk.level };
    risk.gravity = dto.gravity;
    risk.probability = dto.probability;
    risk.score = computeRiskScore(dto.gravity, dto.probability);
    risk.level = riskLevelFromScore(risk.score);
    const saved = await this.repo.save(risk);
    await this.raiseIfCritical(saved, before);
    return saved;
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException('Risk not found');
    await this.caRepo.delete({ sourceType: CorrectiveActionSource.RISK, sourceId: id });
  }

  // ---------- Matrix ----------

  /** 5x5 matrix (all 25 cells, zero-filled). Default population: validated risks; employees only get what they may see. */
  async matrix(q: MatrixQueryDto, actor: RiskActor) {
    const qb = this.repo.createQueryBuilder('r').select(['r.id', 'r.gravity', 'r.probability']).orderBy('r.id', 'ASC');
    this.applyVisibility(qb, actor);
    qb.andWhere('r.status = :status', { status: q.status ?? RiskStatus.VALIDATED });
    if (q.zone) qb.andWhere('r.zone = :zone', { zone: q.zone });
    if (q.hazardCategory) qb.andWhere('r.hazardCategory = :hc', { hc: q.hazardCategory });
    const risks = await qb.getMany();
    return { total: risks.length, cells: buildRiskMatrix(risks) };
  }

  // ---------- LMRA ----------

  /**
   * Stores the assessment. Every hazard that is present and not controlled becomes a `proposed` risk
   * (gravity/probability default 3, or 4/4 when the decision is `stop`); an identical open risk (same title and zone)
   * is reused instead of duplicated. Decision `stop` notifies managers (high priority).
   */
  async createLmra(dto: CreateLmraDto, actor: RiskActor): Promise<LmraAssessment> {
    const uncontrolled = dto.hazards.filter((h) => h.present && !h.controlled);
    const [gravity, probability] = dto.decision === LmraDecision.STOP ? [4, 4] : [DEFAULT_LMRA_SCORE_INPUT, DEFAULT_LMRA_SCORE_INPUT];
    const riskIds: number[] = [];
    const created: Risk[] = [];
    for (const h of uncontrolled) {
      const title = h.label.slice(0, 200);
      const existing = await this.repo.findOne({
        where: { title, zone: dto.location ?? IsNull(), status: In([RiskStatus.PROPOSED, RiskStatus.VALIDATED]) },
        select: ['id'],
      });
      if (existing) {
        riskIds.push(existing.id);
        continue;
      }
      const score = computeRiskScore(gravity, probability);
      const risk = await this.repo.save(
        this.repo.create({
          title,
          description: `Danger non maîtrisé signalé lors d'une LMRA (tâche : ${dto.task}).`,
          hazardCategory: 'lmra',
          zone: dto.location ?? null,
          department: null,
          gravity,
          probability,
          score,
          level: riskLevelFromScore(score),
          recommendedMeasures: null,
          status: RiskStatus.PROPOSED,
          proposedById: actor.id,
          validatedById: null,
        }),
      );
      riskIds.push(risk.id);
      created.push(risk);
    }
    const saved = await this.lmraRepo.save(
      this.lmraRepo.create({
        userId: actor.id,
        task: dto.task,
        location: dto.location ?? null,
        hazards: dto.hazards.map((h) => ({ label: h.label, present: h.present, controlled: h.controlled })),
        decision: dto.decision,
        comments: dto.comments ?? null,
        riskIds,
      }),
    );
    if (created.length) await this.notifyProposed(created);
    if (dto.decision === LmraDecision.STOP) {
      await this.notifications.notifyRoles(MANAGER_ROLES, {
        type: NotificationType.ALERT,
        title: 'LMRA : arrêt de travail (STOP)',
        body: `${dto.task}${dto.location ? ` — ${dto.location}` : ''}`.slice(0, 200),
        data: { lmraId: saved.id, riskIds, userId: actor.id },
        priority: 'high',
      });
    }
    return saved;
  }

  async listLmra(q: ListLmraQueryDto, actor: RiskActor) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.lmraRepo
      .createQueryBuilder('l')
      .leftJoin('l.user', 'u')
      .addSelect(['u.id', 'u.firstName', 'u.lastName'])
      .orderBy('l.createdAt', 'DESC')
      .addOrderBy('l.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (!isManagerActor(actor)) qb.andWhere('l.userId = :me', { me: actor.id });
    else if (q.userId !== undefined) qb.andWhere('l.userId = :uid', { uid: q.userId });
    if (q.decision) qb.andWhere('l.decision = :d', { d: q.decision });
    if (q.from) qb.andWhere('l.createdAt >= :from', { from: q.from });
    if (q.to) qb.andWhere('l.createdAt <= :to', { to: q.to });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ---------- helpers ----------

  async assertExists(id: number): Promise<void> {
    if (!(await this.repo.count({ where: { id } }))) throw new NotFoundException('Risk not found');
  }

  private async mustFind(id: number): Promise<Risk> {
    const risk = await this.repo.findOne({ where: { id } });
    if (!risk) throw new NotFoundException('Risk not found');
    return risk;
  }

  private canSee(risk: Risk, actor: RiskActor): boolean {
    return isManagerActor(actor) || PUBLIC_STATUSES.includes(risk.status) || risk.proposedById === actor.id;
  }

  private applyVisibility(qb: any, actor: RiskActor): void {
    if (isManagerActor(actor)) return;
    qb.andWhere('(r.status IN (:...pub) OR r.proposedById = :me)', { pub: PUBLIC_STATUSES, me: actor.id });
  }

  private notifyProposed(risks: Risk[]) {
    const first = risks[0];
    return this.notifications.notifyRoles(MANAGER_ROLES, {
      type: NotificationType.ALERT,
      title: risks.length > 1 ? `${risks.length} risques proposés` : 'Nouveau risque proposé',
      body: risks.map((r) => r.title).join(', ').slice(0, 200),
      data: { riskId: first.id, riskIds: risks.map((r) => r.id) },
    });
  }

  /** Validated + critical (newly validated or newly critical) -> alert `risk` + managers notified. Never throws. */
  private async raiseIfCritical(risk: Risk, before?: { status: RiskStatus; level: RiskLevel }): Promise<void> {
    if (risk.status !== RiskStatus.VALIDATED || risk.level !== RiskLevel.CRITICAL) return;
    if (before && before.status === RiskStatus.VALIDATED && before.level === RiskLevel.CRITICAL) return;
    try {
      await this.alerts.create({
        title: `Risque critique : ${risk.title}`,
        description: `Score ${risk.score} (gravité ${risk.gravity} x probabilité ${risk.probability})${risk.zone ? ` — zone ${risk.zone}` : ''}.`,
        severity: AlertSeverity.CRITICAL,
        type: AlertType.RISK,
        metadata: { riskId: risk.id, score: risk.score, zone: risk.zone },
      });
      await this.notifications.notifyRoles(MANAGER_ROLES, {
        type: NotificationType.ALERT,
        title: `Risque critique : ${risk.title}`.slice(0, 200),
        body: `Score ${risk.score}${risk.zone ? ` — ${risk.zone}` : ''}`,
        data: { riskId: risk.id },
        priority: 'high',
      });
    } catch (err) {
      this.logger.error(`critical risk alert for ${risk.id} failed: ${(err as Error).message}`);
    }
  }
}
