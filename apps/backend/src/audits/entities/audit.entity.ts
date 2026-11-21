import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AuditStatus, AuditType } from '../enums/audit.enums';
import { AuditResponse } from './audit-response.entity';
import { ChecklistTemplate } from './checklist-template.entity';

@Entity('audit')
@Index(['scheduledAt'])
export class Audit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'enum', enum: AuditType, default: AuditType.INTERNAL })
  type: AuditType;

  @Column({ type: 'varchar', length: 100 })
  standard: string;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  auditorName: string | null;

  @Column({ type: 'int', nullable: true })
  auditorId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'auditorId' })
  auditor: User | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zone: string | null;

  @Column({ type: 'enum', enum: AuditStatus, default: AuditStatus.PLANNED })
  status: AuditStatus;

  /** Compliance percentage 0-100 (conform / (conform + non_conform)); null until scored. */
  @Column({ type: 'float', nullable: true })
  score: number | null;

  @Column({ type: 'int', nullable: true })
  templateId: number | null;

  @ManyToOne(() => ChecklistTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'templateId' })
  template: ChecklistTemplate | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  createdById: number | null;

  @OneToMany(() => AuditResponse, (r) => r.audit)
  responses: AuditResponse[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
