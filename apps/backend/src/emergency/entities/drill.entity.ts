import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DrillStatus } from '../enums/emergency.enums';
import { EmergencyScenario } from './emergency-scenario.entity';

@Entity('drill')
export class Drill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  scenarioId: number | null;

  @ManyToOne(() => EmergencyScenario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'scenarioId' })
  scenario: EmergencyScenario | null;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zone: string | null;

  @Column({ type: 'enum', enum: DrillStatus, default: DrillStatus.PLANNED })
  status: DrillStatus;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number | null;

  @Column({ type: 'int', nullable: true })
  participantsCount: number | null;

  @Column({ type: 'int', nullable: true })
  evacuatedCount: number | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @Column({ type: 'int', nullable: true })
  createdById: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
