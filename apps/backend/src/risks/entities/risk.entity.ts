import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RiskLevel, RiskStatus } from '../enums/risk.enums';
import { ActionPlan } from './action-plan.entity';

@Entity('risk')
@Index(['status', 'level'])
export class Risk {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100 })
  hazardCategory: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string | null;

  @Column({ type: 'int' })
  gravity: number;

  @Column({ type: 'int' })
  probability: number;

  /** gravity x probability */
  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'enum', enum: RiskLevel })
  level: RiskLevel;

  @Column({ type: 'text', nullable: true })
  recommendedMeasures: string | null;

  @Column({ type: 'enum', enum: RiskStatus, default: RiskStatus.PROPOSED })
  status: RiskStatus;

  @Column({ type: 'int', nullable: true })
  proposedById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proposedById' })
  proposedBy: User | null;

  @Column({ type: 'int', nullable: true })
  validatedById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'validatedById' })
  validatedBy: User | null;

  @OneToMany(() => ActionPlan, (p) => p.risk)
  actionPlans: ActionPlan[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
