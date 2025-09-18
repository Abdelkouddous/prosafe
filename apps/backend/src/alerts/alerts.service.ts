import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AlertStatus } from './enums/alert-status.enum';
import { AlertSeverity } from './enums/alert-severity.enum';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertsRepository: Repository<Alert>,
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
      throw new Error('Alert not found');
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
      type: 'system' as any,
      metadata
    });
  }
}