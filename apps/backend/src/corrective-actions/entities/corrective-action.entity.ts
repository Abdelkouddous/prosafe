import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CorrectiveActionSource, CorrectiveActionStatus } from '../enums/corrective-action.enums';

@Entity('corrective_action')
@Index(['sourceType', 'sourceId'])
@Index(['ownerId', 'status'])
export class CorrectiveAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: CorrectiveActionSource })
  sourceType: CorrectiveActionSource;

  /** incident.id (validated), or risk.id / audit.id (no FK: those tables arrive in Phase 4). */
  @Column()
  sourceId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'enum', enum: CorrectiveActionStatus, default: CorrectiveActionStatus.TODO })
  status: CorrectiveActionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  doneAt: Date | null;

  @Column({ type: 'int', nullable: true })
  createdById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
