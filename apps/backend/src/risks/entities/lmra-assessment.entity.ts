import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LmraDecision } from '../enums/risk.enums';

export interface LmraHazard {
  label: string;
  present: boolean;
  controlled: boolean;
}

/** Last Minute Risk Assessment filled by an employee before a task. */
@Entity('lmra_assessment')
export class LmraAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 200 })
  task: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  hazards: LmraHazard[];

  @Column({ type: 'enum', enum: LmraDecision })
  decision: LmraDecision;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  /** Ids of the (proposed) risks created or matched from uncontrolled hazards. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  riskIds: number[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
