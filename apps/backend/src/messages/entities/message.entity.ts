import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MessageStatus } from '../enums/message-status.enum';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column()
  sender_id: number;

  @ManyToOne(() => User, { nullable: true }) // A message might be a broadcast without a single recipient
  @JoinColumn({ name: 'recipient_id' })
  recipient?: User;

  @Column({ nullable: true }) // Nullable if it's a broadcast or handled differently
  recipient_id?: number;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.UNREAD,
  })
  status: MessageStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  is_urgent: boolean;
}

export class AdminMessage {
  id: number;

  message: string;
}
