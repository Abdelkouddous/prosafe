import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { Alert } from './entities/alert.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, Incident]), NotificationsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService]
})
export class AlertsModule {}