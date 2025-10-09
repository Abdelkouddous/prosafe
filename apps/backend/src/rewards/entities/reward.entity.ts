import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
@Unique(['incidentId'])
export class Reward {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  incidentId?: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ length: 100, nullable: true })
  reason?: string;

  @CreateDateColumn()
  created_at: Date;
}