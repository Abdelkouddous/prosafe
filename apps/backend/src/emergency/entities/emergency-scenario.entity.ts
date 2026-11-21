import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EmergencyScenarioType } from '../enums/emergency.enums';

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

@Entity('emergency_scenario')
export class EmergencyScenario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'enum', enum: EmergencyScenarioType, default: EmergencyScenarioType.OTHER })
  type: EmergencyScenarioType;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  steps: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  contacts: EmergencyContact[];

  @Column({ type: 'varchar', length: 200, nullable: true })
  assemblyPoint: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
