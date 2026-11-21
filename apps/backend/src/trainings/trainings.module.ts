import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Enrollment } from './entities/enrollment.entity';
import { TrainingSession } from './entities/training-session.entity';
import { Training } from './entities/training.entity';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Training, TrainingSession, Enrollment, User]), NotificationsModule],
  controllers: [TrainingsController],
  providers: [TrainingsService],
  exports: [TrainingsService],
})
export class TrainingsModule {}
