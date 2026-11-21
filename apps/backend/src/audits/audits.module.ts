import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from '../alerts/alerts.module';
import { CorrectiveActionsModule } from '../corrective-actions/corrective-actions.module';
import { CorrectiveAction } from '../corrective-actions/entities/corrective-action.entity';
import { FilesModule } from '../files/files.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';
import { AuditsController, ComplianceDocumentsController } from './audits.controller';
import { AuditsService } from './audits.service';
import { ComplianceDocumentsService } from './compliance-documents.service';
import { AuditResponse } from './entities/audit-response.entity';
import { Audit } from './entities/audit.entity';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { ComplianceDocument } from './entities/compliance-document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Audit, ChecklistTemplate, AuditResponse, ComplianceDocument, CorrectiveAction, User]),
    FilesModule,
    NotificationsModule,
    AlertsModule,
    CorrectiveActionsModule,
  ],
  controllers: [AuditsController, ComplianceDocumentsController],
  providers: [AuditsService, ComplianceDocumentsService],
  exports: [AuditsService],
})
export class AuditsModule {}
