import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from '../audits/entities/audit.entity';
import { Risk } from '../risks/entities/risk.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Enrollment } from '../trainings/entities/enrollment.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, InventoryItem, Enrollment, Risk, Audit])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
