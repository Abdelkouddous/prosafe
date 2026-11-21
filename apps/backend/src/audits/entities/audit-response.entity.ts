import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { StoredFile } from '../../files/entities/stored-file.entity';
import { AuditResult } from '../enums/audit.enums';
import { Audit } from './audit.entity';

@Entity('audit_response')
@Unique(['auditId', 'itemId'])
export class AuditResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  auditId: number;

  @ManyToOne(() => Audit, (a) => a.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auditId' })
  audit: Audit;

  /** ChecklistItem.id inside the audit template */
  @Column({ type: 'int' })
  itemId: number;

  @Column({ type: 'enum', enum: AuditResult })
  result: AuditResult;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'int', nullable: true })
  evidenceFileId: number | null;

  @ManyToOne(() => StoredFile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evidenceFileId' })
  evidenceFile: StoredFile | null;

  /** Corrective action generated for this non-conformity (prevents duplicates on re-submit). */
  @Column({ type: 'int', nullable: true })
  correctiveActionId: number | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
