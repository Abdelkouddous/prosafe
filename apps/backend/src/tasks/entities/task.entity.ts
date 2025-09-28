import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TaskStatus } from '../enum/task-status.enum';

/**
 * Task Entity
 * Represents a training course announcement that is visible to all users in the enterprise
 */
@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 500 })
  description: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Pending })
  status: TaskStatus;

  @Column({ default: 'Low', length: 10 })
  priority: string; // 1 = Low, 5 = High

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ length: 200, nullable: true })
  location: string;

  @Column({ nullable: true })
  maxParticipants: number;

  @Column({ default: 0 })
  currentParticipants: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * The admin user who created this training announcement
   */
  @ManyToOne(() => User, (user) => user.createdTasks, { eager: true })
  createdBy: User;
}
