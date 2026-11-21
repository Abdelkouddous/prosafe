import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StoredFile } from '../../files/entities/stored-file.entity';
import { Incident } from './incident.entity';

export enum IncidentMediaKind {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('incident_media')
export class IncidentMedia {
  @PrimaryGeneratedColumn()
  id: number;

  /** FK to incident.id (numeric primary key, not the INC-... business id) */
  @Index()
  @Column()
  incidentRefId: number;

  @ManyToOne(() => Incident, (incident) => incident.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidentRefId' })
  incident: Incident;

  @Column()
  fileId: number;

  @ManyToOne(() => StoredFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: StoredFile;

  @Column({ type: 'enum', enum: IncidentMediaKind })
  kind: IncidentMediaKind;
}
