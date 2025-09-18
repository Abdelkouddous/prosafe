import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InventoryCategory } from '../enums/inventory-category.enum';
import { InventoryStatus } from '../enums/inventory-status.enum';

@Entity()
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 5, default: 0 })
  price: number;

  @Column('int')
  quantity: number;

  @Column('int')
  min_stock_level: number;

  @Column({
    type: 'enum',
    enum: InventoryCategory,
  })
  category: InventoryCategory;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.ACTIVE,
  })
  status: InventoryStatus;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  created_by_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @Column({ nullable: true })
  updated_by_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updated_by: User;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
