import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notification_preference')
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true }) incidents: boolean;
  @Column({ default: true }) trainings: boolean;
  @Column({ default: true }) audits: boolean;
  @Column({ default: true }) inventory: boolean;
  @Column({ default: true }) emergency: boolean;
  @Column({ default: true }) messages: boolean;
  @Column({ default: true }) push: boolean;
  @Column({ default: true }) email: boolean;
}
