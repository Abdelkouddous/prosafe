import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './common/auth-throttler.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import configuration from './config';
import { MessagesModule } from './messages/messages.module';
import { LoggerModule } from './logger/logger.module';
import { AlertsModule } from './alerts/alerts.module';
import { IncidentsModule } from './incidents/incidents.module';
import { InventoryModule } from './inventory/inventory.module';
import { AdminModule } from './admin/admin.module';
import { RewardsModule } from './rewards/rewards.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { TrainingsModule } from './trainings/trainings.module';
import { CorrectiveActionsModule } from './corrective-actions/corrective-actions.module';
import { MessagingModule } from './messaging/messaging.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StatsModule } from './stats/stats.module';
import { ReportsModule } from './reports/reports.module';
import { RisksModule } from './risks/risks.module';
import { AuditsModule } from './audits/audits.module';
import { EmergencyModule } from './emergency/emergency.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: parseInt(configService.get<string>('MAIL_PORT') || '587', 10),
          secure: (configService.get<string>('MAIL_SECURE') || 'false').toLowerCase() === 'true',
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM') || '"Prosafe" <no-reply@prosafelabs.local>',
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),
    // Global rate limit: THROTTLE_LIMIT requests / minute / IP (default 100). Stricter limits via @Throttle.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: parseInt(process.env.THROTTLE_LIMIT ?? '', 10) || 100 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    MessagesModule,
    LoggerModule,
    IncidentsModule,
    InventoryModule,
    TasksModule,
    AlertsModule,
    AdminModule,
    RewardsModule,
    FilesModule,
    NotificationsModule,
    MaintenanceModule,
    TrainingsModule,
    RealtimeModule,
    CorrectiveActionsModule,
    MessagingModule,
    StatsModule,
    ReportsModule,
    RisksModule,
    AuditsModule,
    EmergencyModule,
    FeedbackModule,
    // Training
    // Conferences
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
