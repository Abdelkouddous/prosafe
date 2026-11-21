import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/** Metadata of a file stored on disk under UPLOADS_DIR. */
@Entity('stored_file')
export class StoredFile {
  @PrimaryGeneratedColumn()
  id: number;

  /** Path relative to UPLOADS_DIR */
  @Column()
  path: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'int', nullable: true })
  uploadedById: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
