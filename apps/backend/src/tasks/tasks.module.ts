import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';

/**
 * Tasks Module
 * Handles task management with admin-only creation and assignment to standard users
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
