import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IncidentType } from '../enums/incident-type.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

@Entity()
@Unique(['photoHash', 'reportedBy'])
@Index(['geoLatitude', 'geoLongitude'])
@Index(['timestamp'])
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  incidentId: string;

  // Fixed: Use bytea for PostgreSQL binary data
  @Column('bytea')
  photo: Buffer;

  @Column({ length: 64 })
  photoHash: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentType,
  })
  type: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
  })
  severity: IncidentSeverity;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column()
  reportedBy: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedBy' })
  reporter: User;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.OPEN,
  })
  status: IncidentStatus;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  geoLatitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  geoLongitude: number;

  @Column({ length: 200, nullable: true })
  manualAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolvedBy' })
  resolver: User;
}
