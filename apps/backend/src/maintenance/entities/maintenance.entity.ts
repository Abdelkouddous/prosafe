import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { InventoryItem } from '../../inventory/entities/inventory.entity';
import { User } from '../../users/entities/user.entity';
import { MaintenanceResult, MaintenanceStatus, MaintenanceType } from '../enums/maintenance.enums';

@Entity('maintenance')
@Index(['itemId', 'status'])
@Index(['status', 'scheduledAt'])
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemId: number;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @Column({ type: 'enum', enum: MaintenanceType, default: MaintenanceType.INSPECTION })
  type: MaintenanceType;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  doneAt: Date | null;

  @Column({ type: 'int', nullable: true })
  performedById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'performedById' })
  performedBy: User | null;

  @Column({ type: 'enum', enum: MaintenanceResult, nullable: true })
  result: MaintenanceResult | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.PLANNED })
  status: MaintenanceStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
