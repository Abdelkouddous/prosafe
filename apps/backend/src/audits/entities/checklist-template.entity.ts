import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface ChecklistItem {
  /** Unique within the template (1..n); referenced by audit responses. */
  id: number;
  /** e.g. "4.1" */
  clause: string;
  question: string;
}

@Entity('checklist_template')
export class ChecklistTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  standard: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items: ChecklistItem[];

  @Column({ type: 'int', nullable: true })
  createdById: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
