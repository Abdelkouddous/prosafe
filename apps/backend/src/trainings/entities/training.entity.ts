import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('training')
export class Training {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  category: string | null;

  @Column({ type: 'float', nullable: true })
  durationHours: number | null;

  /** Months a passed training stays valid (certification); null = never expires. */
  @Column({ type: 'int', nullable: true })
  validityMonths: number | null;

  /** Roles for which the training is mandatory (e.g. ['employee']). */
  @Column('text', { array: true, default: () => "'{}'" })
  mandatoryForRoles: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
