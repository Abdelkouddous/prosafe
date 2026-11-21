import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AlertStatus } from './enums/alert-status.enum';
import { AlertSeverity } from './enums/alert-severity.enum';
import { AlertType } from './enums/alert-type.enum';
import { Incident } from '../incidents/entities/incident.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { MANAGER_ROLES } from '../users/enums/role.enum';

export const SPIKE_FACTOR = 1.5;
export const SPIKE_MIN_COUNT = 3;
const DAY = 24 * 60 * 60 * 1000;

/**
 * Spike rule (docs/API_CONTRACT.md § Stats): last-7-day count > 1.5 x the weekly average of the 4 previous weeks
 * AND at least 3 incidents.
 */
export function isIncidentSpike(last7Days: number, previous4WeeksTotal: number): boolean {
  const weeklyAverage = previous4WeeksTotal / 4;
  return last7Days >= SPIKE_MIN_COUNT && last7Days > SPIKE_FACTOR * weeklyAverage;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertsRepository.create(createAlertDto);
    return this.alertsRepository.save(alert);
  }

  async findAll(page: number = 1, limit: number = 10, severity?: AlertSeverity, status?: AlertStatus): Promise<{ alerts: Alert[], total: number, page: number, totalPages: number }> {
    const queryBuilder = this.alertsRepository.createQueryBuilder('alert')
      .leftJoinAndSelect('alert.affected_user', 'affected_user')
      .leftJoinAndSelect('alert.resolved_by', 'resolved_by')
      .orderBy('alert.created_at', 'DESC');

    if (severity) {
      queryBuilder.andWhere('alert.severity = :severity', { severity });
    }

    if (status) {
      queryBuilder.andWhere('alert.status = :status', { status });
    }

    const [alerts, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      alerts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number): Promise<Alert> {
    return this.alertsRepository.findOne({
      where: { id },
      relations: ['affected_user', 'resolved_by']
    });
  }

  async update(id: number, updateAlertDto: UpdateAlertDto): Promise<Alert> {
    const alert = await this.findOne(id);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (updateAlertDto.status === AlertStatus.RESOLVED) {
      updateAlertDto['resolved_at'] = new Date();
    }

    Object.assign(alert, updateAlertDto);
    return this.alertsRepository.save(alert);
  }

  async remove(id: number): Promise<void> {
    await this.alertsRepository.delete(id);
  }

  async getAlertStats(): Promise<any> {
    const totalAlerts = await this.alertsRepository.count();
    const unresolvedAlerts = await this.alertsRepository.count({ where: { status: AlertStatus.UNRESOLVED } });
    const criticalAlerts = await this.alertsRepository.count({ where: { severity: AlertSeverity.CRITICAL } });
    const highAlerts = await this.alertsRepository.count({ where: { severity: AlertSeverity.HIGH } });

    return {
      total: totalAlerts,
      unresolved: unresolvedAlerts,
      critical: criticalAlerts,
      high: highAlerts
    };
  }

  // Helper method to create system alerts
  async createSystemAlert(title: string, description: string, severity: AlertSeverity = AlertSeverity.MEDIUM, metadata?: any): Promise<Alert> {
    return this.create({
      title,
      description,
      severity,
      type: AlertType.SYSTEM,
      metadata
    });
  }

  // ---------- Statistical alerts (M4.3) ----------

  /** Daily 06:30 (Africa/Algiers). */
  @Cron('30 6 * * *', { name: 'incident-spike-detection', timeZone: 'Africa/Algiers' })
  async runDailyChecks(now = new Date()): Promise<{ spikes: number }> {
    try {
      return { spikes: await this.detectIncidentSpikes(now) };
    } catch (err) {
      this.logger.error(`incident spike detection failed: ${(err as Error).message}`);
      return { spikes: 0 };
    }
  }

  /**
   * For every incident type: creates an `incident_spike` alert (and notifies managers) when the rule matches.
   * At most one alert per type per 7 days. Returns the number of alerts created.
   */
  async detectIncidentSpikes(now: Date): Promise<number> {
    const lastWeekStart = new Date(now.getTime() - 7 * DAY);
    const previousStart = new Date(now.getTime() - 35 * DAY);
    const rows: { type: string; recent: string; previous: string }[] = await this.incidentRepository
      .createQueryBuilder('i')
      .select('i.type', 'type')
      .addSelect('COUNT(*) FILTER (WHERE i.timestamp >= :lastWeekStart)', 'recent')
      .addSelect('COUNT(*) FILTER (WHERE i.timestamp < :lastWeekStart)', 'previous')
      .where('i.timestamp >= :previousStart AND i.timestamp <= :now', { previousStart, now })
      .setParameters({ lastWeekStart })
      .groupBy('i.type')
      .getRawMany();

    let created = 0;
    for (const row of rows) {
      const recent = Number(row.recent);
      const previous = Number(row.previous);
      if (!isIncidentSpike(recent, previous)) continue;

      const duplicate = await this.alertsRepository
        .createQueryBuilder('a')
        .where('a.type = :type', { type: AlertType.INCIDENT_SPIKE })
        .andWhere("a.metadata ->> 'incidentType' = :incidentType", { incidentType: row.type })
        .andWhere('a.created_at > :since', { since: new Date(now.getTime() - 7 * DAY) })
        .getCount();
      if (duplicate) continue;

      const weeklyAverage = Math.round((previous / 4) * 10) / 10;
      await this.create({
        title: `Hausse des incidents: ${row.type}`,
        description: `${recent} incidents de type ${row.type} sur les 7 derniers jours (moyenne hebdomadaire précédente: ${weeklyAverage}).`,
        severity: recent >= 2 * Math.max(weeklyAverage, 1) + 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
        type: AlertType.INCIDENT_SPIKE,
        metadata: { incidentType: row.type, last7Days: recent, previous4WeeksWeeklyAverage: weeklyAverage },
      });
      created++;
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, {
        type: NotificationType.ALERT,
        title: `Hausse des incidents: ${row.type}`,
        body: `${recent} incidents sur 7 jours (moyenne précédente ${weeklyAverage}/semaine)`,
        data: { key: `incident_spike:${row.type}`, incidentType: row.type },
        priority: 'high',
      }, 24 * 7);
    }
    return created;
  }
}
