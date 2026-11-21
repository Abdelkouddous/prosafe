import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FeedbackCategory } from '../enums/feedback.enums';

@Entity('feedback')
@Index(['createdAt'])
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /** 1-5 */
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'enum', enum: FeedbackCategory, default: FeedbackCategory.OTHER })
  category: FeedbackCategory;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  appVersion: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  platform: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
