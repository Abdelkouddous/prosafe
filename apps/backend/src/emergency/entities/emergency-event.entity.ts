import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EmergencyScenario } from './emergency-scenario.entity';

@Entity('emergency_event')
@Index(['active'])
export class EmergencyEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  scenarioId: number | null;

  @ManyToOne(() => EmergencyScenario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scenarioId' })
  scenario: EmergencyScenario | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zone: string | null;

  @Column({ type: 'int', nullable: true })
  triggeredById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'triggeredById' })
  triggeredBy: User | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  triggeredAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  closedById: number | null;

  @Column({ default: true })
  active: boolean;

  /** Alert (type emergency) raised for this event */
  @Column({ type: 'int', nullable: true })
  alertId: number | null;
}
