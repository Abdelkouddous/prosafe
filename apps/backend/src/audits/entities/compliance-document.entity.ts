import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { StoredFile } from '../../files/entities/stored-file.entity';
import { ComplianceDocumentType } from '../enums/audit.enums';
import { Audit } from './audit.entity';

@Entity('compliance_document')
export class ComplianceDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'enum', enum: ComplianceDocumentType, default: ComplianceDocumentType.OTHER })
  type: ComplianceDocumentType;

  @Column()
  fileId: number;

  @ManyToOne(() => StoredFile, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'fileId' })
  file: StoredFile;

  @Column({ type: 'date', nullable: true })
  validUntil: string | null;

  @Column({ type: 'int', nullable: true })
  auditId: number | null;

  @ManyToOne(() => Audit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'auditId' })
  audit: Audit | null;

  @Column({ type: 'int', nullable: true })
  uploadedById: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
