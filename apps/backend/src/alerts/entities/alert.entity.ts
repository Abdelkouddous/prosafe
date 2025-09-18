import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AlertSeverity } from '../enums/alert-severity.enum';
import { AlertStatus } from '../enums/alert-status.enum';
import { AlertType } from '../enums/alert-type.enum';

@Entity()
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.LOW,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.UNRESOLVED,
  })
  status: AlertStatus;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({ nullable: true })
  source_ip: string;

  @Column({ nullable: true })
  affected_user_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'affected_user_id' })
  affected_user: User;

  @Column({ nullable: true })
  resolved_by_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolved_by: User;

  @Column({ nullable: true })
  resolved_at: Date;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
