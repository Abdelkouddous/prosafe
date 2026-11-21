import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from '../incidents/entities/incident.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { CorrectiveActionsController } from './corrective-actions.controller';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CorrectiveAction } from './entities/corrective-action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CorrectiveAction, Incident, User]), NotificationsModule],
  controllers: [CorrectiveActionsController],
  providers: [CorrectiveActionsService],
  exports: [CorrectiveActionsService],
})
export class CorrectiveActionsModule {}
