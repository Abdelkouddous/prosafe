import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from '../alerts/alerts.module';
import { CorrectiveActionsModule } from '../corrective-actions/corrective-actions.module';
import { CorrectiveAction } from '../corrective-actions/entities/corrective-action.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { ActionPlansController } from './action-plans.controller';
import { ActionPlansService } from './action-plans.service';
import { ActionPlan } from './entities/action-plan.entity';
import { LmraAssessment } from './entities/lmra-assessment.entity';
import { Risk } from './entities/risk.entity';
import { RisksController } from './risks.controller';
import { RisksService } from './risks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Risk, ActionPlan, LmraAssessment, CorrectiveAction, User]),
    NotificationsModule,
    AlertsModule,
    CorrectiveActionsModule,
  ],
  controllers: [RisksController, ActionPlansController],
  providers: [RisksService, ActionPlansService],
  exports: [RisksService],
})
export class RisksModule {}
