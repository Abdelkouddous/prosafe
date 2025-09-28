import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { MessagesModule } from '../messages/messages.module';
import { InventoryModule } from '../inventory/inventory.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    UsersModule,
    TasksModule,
    MessagesModule,
    InventoryModule,
    IncidentsModule,
    AlertsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}