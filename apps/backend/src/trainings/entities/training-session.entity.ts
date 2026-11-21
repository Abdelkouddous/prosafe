import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SessionStatus } from '../enums/training.enums';
import { Training } from './training.entity';

@Entity('training_session')
@Index(['trainingId', 'startAt'])
export class TrainingSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trainingId: number;

  @ManyToOne(() => Training, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainingId' })
  training: Training;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endAt: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  trainer: string | null;

  /** null = unlimited */
  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.PLANNED })
  status: SessionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /** Computed (not a column): non-cancelled enrollments. */
  enrolledCount?: number;
}
