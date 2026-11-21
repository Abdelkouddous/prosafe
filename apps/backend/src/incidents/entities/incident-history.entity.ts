import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IncidentStatus } from '../enums/incident-status.enum';
import { Incident } from './incident.entity';

@Entity('incident_history')
export class IncidentHistory {
  @PrimaryGeneratedColumn()
  id: number;

  /** FK to incident.id */
  @Index()
  @Column()
  incidentRefId: number;

  @ManyToOne(() => Incident, (incident) => incident.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidentRefId' })
  incident: Incident;

  @Column({ type: 'enum', enum: IncidentStatus, nullable: true })
  fromStatus: IncidentStatus | null;

  @Column({ type: 'enum', enum: IncidentStatus })
  toStatus: IncidentStatus;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'int', nullable: true })
  changedById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedById' })
  changedBy: User | null;

  @CreateDateColumn()
  changedAt: Date;
}
