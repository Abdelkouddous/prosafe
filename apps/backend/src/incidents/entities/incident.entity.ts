import { OneToMany, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IncidentType } from '../enums/incident-type.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentMedia } from './incident-media.entity';
import { IncidentHistory } from './incident-history.entity';

@Entity()
@Index(['geoLatitude', 'geoLongitude'])
@Index(['timestamp'])
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  incidentId: string;

  /** sha256 of the first image (duplicate detection). Never returned in API responses. */
  @Column({ length: 64, nullable: true, select: false })
  photoHash: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string | null;

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

  @OneToMany(() => IncidentMedia, (m) => m.incident)
  media: IncidentMedia[];

  @OneToMany(() => IncidentHistory, (h) => h.incident)
  history: IncidentHistory[];
}
