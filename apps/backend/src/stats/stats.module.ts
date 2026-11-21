import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from '../audits/entities/audit.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { CorrectiveActionsModule } from '../corrective-actions/corrective-actions.module';
import { Incident } from '../incidents/entities/incident.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Maintenance } from '../maintenance/entities/maintenance.entity';
import { Enrollment } from '../trainings/entities/enrollment.entity';
import { TrainingsModule } from '../trainings/trainings.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, Alert, Audit, InventoryItem, Maintenance, Enrollment]), TrainingsModule, CorrectiveActionsModule],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
