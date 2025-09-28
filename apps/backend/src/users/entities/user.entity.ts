import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Role } from '../enums/role.enum';
import { Task } from '../../tasks/entities/task.entity';
import { Alert } from '../../alerts/entities/alert.entity';
import { Incident } from '../../incidents/entities/incident.entity';
import { InventoryItem } from '../../inventory/entities/inventory.entity';
import { Message } from '../../messages/entities/message.entity';

/**
 * User Entity
 * Represents a user in the system, with roles and tasks
 */
@Entity()
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'simple-array',
    default: Role.pending,
  })
  roles: Role[];

  /**
   * Tasks created by this user (admin only)
   */
  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  /**
   * Alerts where this user is affected
   */
  @OneToMany(() => Alert, (alert) => alert.affected_user)
  affectedAlerts: Alert[];

  /**
   * Alerts resolved by this user
   */
  @OneToMany(() => Alert, (alert) => alert.resolved_by)
  resolvedAlerts: Alert[];

  /**
   * Incidents reported by this user
   */
  @OneToMany(() => Incident, (incident) => incident.reporter)
  reportedIncidents: Incident[];

  /**
   * Incidents resolved by this user
   */
  @OneToMany(() => Incident, (incident) => incident.resolver)
  resolvedIncidents: Incident[];

  /**
   * Inventory items created by this user
   */
  @OneToMany(() => InventoryItem, (item) => item.created_by)
  createdInventoryItems: InventoryItem[];

  /**
   * Inventory items updated by this user
   */
  @OneToMany(() => InventoryItem, (item) => item.updated_by)
  updatedInventoryItems: InventoryItem[];

  /**
   * Messages sent by this user
   */
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  /**
   * Messages received by this user
   */
  @OneToMany(() => Message, (message) => message.recipient)
  receivedMessages: Message[];
}
