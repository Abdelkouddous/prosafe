import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Drill } from './entities/drill.entity';
import { EmergencyEvent } from './entities/emergency-event.entity';
import { EmergencyScenario } from './entities/emergency-scenario.entity';
import { EmergencyController } from './emergency.controller';
import { EmergencyService } from './emergency.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyScenario, EmergencyEvent, Drill]), NotificationsModule, AlertsModule],
  controllers: [EmergencyController],
  providers: [EmergencyService],
  exports: [EmergencyService],
})
export class EmergencyModule {}
