import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EnrollmentStatus } from '../enums/training.enums';
import { TrainingSession } from './training-session.entity';

@Entity('enrollment')
@Unique('UQ_enrollment_session_user', ['sessionId', 'userId'])
@Index(['userId', 'status'])
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: number;

  @ManyToOne(() => TrainingSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: TrainingSession;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.REGISTERED })
  status: EnrollmentStatus;

  @Column({ type: 'int', nullable: true })
  score: number | null;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
