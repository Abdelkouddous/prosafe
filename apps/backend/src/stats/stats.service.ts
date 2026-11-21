import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Alert } from '../alerts/entities/alert.entity';
import { AlertStatus } from '../alerts/enums/alert-status.enum';
import { Audit } from '../audits/entities/audit.entity';
import { AuditStatus } from '../audits/enums/audit.enums';
import { CorrectiveActionsService } from '../corrective-actions/corrective-actions.service';
import { Incident } from '../incidents/entities/incident.entity';
import { IncidentSeverity } from '../incidents/enums/incident-severity.enum';
import { IncidentStatus } from '../incidents/enums/incident-status.enum';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Maintenance } from '../maintenance/entities/maintenance.entity';
import { MaintenanceStatus } from '../maintenance/enums/maintenance.enums';
import { Enrollment } from '../trainings/entities/enrollment.entity';
import { EnrollmentStatus } from '../trainings/enums/training.enums';
import { TrainingsService } from '../trainings/trainings.service';
import { GroupBy, PeriodQueryDto } from './dto/stats.dto';
import { linearForecast, monthRange, movingAverageForecast } from './forecast';

const DAY = 24 * 60 * 60 * 1000;
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

/** Percentage with 1 decimal; null when the population is empty. */
export function percentage(ok: number, total: number): number | null {
  return total > 0 ? Math.round((ok / total) * 1000) / 10 : null;
}

const GROUP_EXPR: Record<GroupBy, string> = {
  month: "to_char(i.timestamp, 'YYYY-MM')",
  type: 'i.type::text',
  severity: 'i.severity::text',
  status: 'i.status::text',
  zone: "COALESCE(NULLIF(i.zone, ''), 'N/A')",
  department: "COALESCE(NULLIF(i.department, ''), 'N/A')",
};

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Incident) private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(Alert) private readonly alertRepo: Repository<Alert>,
    @InjectRepository(InventoryItem) private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(Maintenance) private readonly maintenanceRepo: Repository<Maintenance>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly trainings: TrainingsService,
    private readonly correctiveActions: CorrectiveActionsService,
    @InjectRepository(Audit) private readonly auditRepo: Repository<Audit>,
  ) {}

  private applyPeriod(qb: SelectQueryBuilder<Incident>, q: PeriodQueryDto): void {
    if (q.from) qb.andWhere('i.timestamp >= :from', { from: new Date(q.from) });
    if (q.to) {
      const to = new Date(q.to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.to)) {
        to.setUTCDate(to.getUTCDate() + 1);
        qb.andWhere('i.timestamp < :to', { to });
      } else qb.andWhere('i.timestamp <= :to', { to });
    }
  }

  /** Home dashboard (M0.1). Employees: own incident counts + own expiring trainings; alerts are global. */
  async overview(actor: { id: number; isManager: boolean }, now = new Date()) {
    const mine = (qb: SelectQueryBuilder<Incident>) => (actor.isManager ? qb : qb.andWhere('i.reportedBy = :me', { me: actor.id }));

    const byStatus: { status: IncidentStatus; count: string }[] = await mine(
      this.incidentRepo.createQueryBuilder('i').select('i.status', 'status').addSelect('COUNT(*)', 'count'),
    )
      .groupBy('i.status')
      .getRawMany();
    const incidents = { total: 0, open: 0, investigating: 0, resolved: 0, closed: 0 };
    for (const r of byStatus) {
      incidents[r.status] = Number(r.count);
      incidents.total += Number(r.count);
    }

    const criticalOpen = await mine(this.incidentRepo.createQueryBuilder('i'))
      .andWhere('i.severity = :critical AND i.status IN (:...open)', {
        critical: IncidentSeverity.CRITICAL,
        open: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING],
      })
      .getCount();

    const activeAlerts = await this.alertRepo
      .createQueryBuilder('a')
      .where('a.status IN (:...st)', { st: [AlertStatus.UNRESOLVED, AlertStatus.INVESTIGATING] })
      .getCount();

    const soon = new Date(now.getTime() + 30 * DAY);
    const expiring = this.enrollmentRepo
      .createQueryBuilder('e')
      .where('e.status = :passed AND e.expiresAt IS NOT NULL AND e.expiresAt >= :now AND e.expiresAt <= :soon', {
        passed: EnrollmentStatus.PASSED,
        now,
        soon,
      });
    if (!actor.isManager) expiring.andWhere('e.userId = :me', { me: actor.id });
    const expiringTrainings = await expiring.getCount();

    let lowStock = 0;
    let overdueMaintenance = 0;
    if (actor.isManager) {
      lowStock = await this.itemRepo.createQueryBuilder('i').where("i.status IN ('low_stock','out_of_stock')").getCount();
      overdueMaintenance = await this.maintenanceRepo
        .createQueryBuilder('m')
        .where('m.status = :overdue OR (m.status = :planned AND m.scheduledAt < :now)', {
          overdue: MaintenanceStatus.OVERDUE,
          planned: MaintenanceStatus.PLANNED,
          now,
        })
        .getCount();
    }
    return { incidents, activeAlerts, criticalOpen, lowStock, overdueMaintenance, expiringTrainings };
  }

  /** Incident counts grouped by a dimension; month keys are `YYYY-MM` and sorted ascending, others by count desc. */
  async incidentsBy(groupBy: GroupBy, q: PeriodQueryDto): Promise<{ key: string; count: number }[]> {
    const expr = GROUP_EXPR[groupBy];
    const qb = this.incidentRepo.createQueryBuilder('i').select(expr, 'key').addSelect('COUNT(*)', 'count').groupBy(expr);
    this.applyPeriod(qb, q);
    if (groupBy === 'month') qb.orderBy('key', 'ASC');
    else qb.orderBy('count', 'DESC').addOrderBy('key', 'ASC');
    const rows: { key: string; count: string }[] = await qb.getRawMany();
    return rows.map((r) => ({ key: r.key, count: Number(r.count) }));
  }

  /** Average score (0-100, 1 decimal) of completed audits in the period (completion date, else planned date); null when none. */
  private async auditComplianceRate(q: PeriodQueryDto): Promise<number | null> {
    const qb = this.auditRepo
      .createQueryBuilder('a')
      .select('AVG(a.score)', 'avg')
      .where('a.status = :status AND a.score IS NOT NULL', { status: AuditStatus.COMPLETED });
    if (q.from) qb.andWhere('COALESCE(a.completedAt, a.scheduledAt) >= :afrom', { afrom: new Date(q.from) });
    if (q.to) {
      const to = new Date(q.to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.to)) {
        to.setUTCDate(to.getUTCDate() + 1);
        qb.andWhere('COALESCE(a.completedAt, a.scheduledAt) < :ato', { ato: to });
      } else qb.andWhere('COALESCE(a.completedAt, a.scheduledAt) <= :ato', { ato: to });
    }
    const row = await qb.getRawOne();
    return row?.avg === null || row?.avg === undefined ? null : Math.round(Number(row.avg) * 10) / 10;
  }

  async kpis(q: PeriodQueryDto, now = new Date()) {
    // Incidents per month: requested period, default = last 12 months
    const perMonthQuery: PeriodQueryDto = q.from || q.to ? q : { from: new Date(now.getTime() - 365 * DAY).toISOString() };
    const incidentsPerMonth = (await this.incidentsBy('month', perMonthQuery)).map((r) => ({ month: r.key, count: r.count }));

    const resQb = this.incidentRepo
      .createQueryBuilder('i')
      .select('AVG(EXTRACT(EPOCH FROM (i.resolvedAt - i.timestamp)) / 3600)', 'hours')
      .where('i.resolvedAt IS NOT NULL');
    this.applyPeriod(resQb, q);
    const { hours } = (await resQb.getRawOne()) ?? {};
    const meanResolutionHours = hours === null || hours === undefined ? null : Math.round(Number(hours) * 10) / 10;

    // Equipment in service: functional, not expired and not overdue for inspection
    const eq = await this.itemRepo
      .createQueryBuilder('i')
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE i."condition" = 'functional'
          AND (i."expiryDate" IS NULL OR i."expiryDate" >= CURRENT_DATE)
          AND (i."nextInspectionAt" IS NULL OR i."nextInspectionAt" >= :now))`,
        'ok',
      )
      .where("i.status NOT IN ('inactive','discontinued')")
      .setParameters({ now })
      .getRawOne();
    const equipmentComplianceRate = percentage(Number(eq?.ok ?? 0), Number(eq?.total ?? 0));

    const skills = await this.trainings.computeSkills(undefined, now);
    const trainingComplianceRate = percentage(skills.filter((u) => !u.missing.length).length, skills.length);

    return {
      incidentsPerMonth,
      meanResolutionHours,
      equipmentComplianceRate,
      trainingComplianceRate,
      correctiveActionsOverdue: await this.correctiveActions.countOverdue(now),
      auditComplianceRate: await this.auditComplianceRate(q),
    };
  }

  /** 12 complete months of history; forecast starts with the current month (still in progress). */
  async forecast(months = 3, now = new Date()) {
    const currentMonth = monthKey(now);
    const historyStart = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, 1)));
    const rows = await this.incidentsBy('month', { from: `${historyStart}-01` });
    const counts = new Map(rows.map((r) => [r.key, r.count]));
    const historyMonths = monthRange(historyStart, 12);
    const history = historyMonths.map((month) => ({ month, count: counts.get(month) ?? 0 }));
    const values = history.map((h) => h.count);

    const futureMonths = monthRange(currentMonth, months);
    const linear = linearForecast(values, months);
    const average = movingAverageForecast(values, months, 3);
    const forecast = [
      ...futureMonths.map((month, i) => ({ month, count: linear[i], method: 'linear_regression' })),
      ...futureMonths.map((month, i) => ({ month, count: average[i], method: 'moving_average' })),
    ];
    return { history, forecast };
  }
}
