import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ActionPlanStatus } from '../enums/risk.enums';
import { Risk } from './risk.entity';

@Entity('action_plan')
@Index(['riskId', 'status'])
export class ActionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  riskId: number;

  @ManyToOne(() => Risk, (r) => r.actionPlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'riskId' })
  risk: Risk;

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

  @Column({ type: 'enum', enum: ActionPlanStatus, default: ActionPlanStatus.PLANNED })
  status: ActionPlanStatus;

  /** 0-100 */
  @Column({ type: 'int', default: 0 })
  progress: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
