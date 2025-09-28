import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TaskStatus } from './enum/task-status.enum';
import { Role } from '../users/enums/role.enum';

/**
 * Tasks Service
 * Handles training course announcement management
 * Admin users can create and manage training announcements visible to all users
 */
@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new training course announcement (admin only)
   * @param createTaskDto - Training course data
   * @param adminId - ID of the admin creating the announcement
   * @returns Created training announcement
   */
  async create(createTaskDto: CreateTaskDto, adminId: number): Promise<Task> {
    // Verify admin user exists and has admin role
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    if (!admin.roles.includes(Role.admin)) {
      throw new ForbiddenException('Only admin users can create training announcements');
    }

    // Create training announcement
    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: TaskStatus.Pending,
      priority: createTaskDto.priority,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
      startDate: createTaskDto.startDate ? new Date(createTaskDto.startDate) : null,
      location: createTaskDto.location,
      maxParticipants: createTaskDto.maxParticipants,
      currentParticipants: 0,
      createdBy: admin,
    });

    return await this.taskRepository.save(task);
  }

  /**
   * Find all training announcements with optional filtering
   * @param status - Optional status filter
   * @returns Array of training announcements
   */
  async findAll(status?: TaskStatus): Promise<Task[]> {
    const queryBuilder = this.taskRepository.createQueryBuilder('task').leftJoinAndSelect('task.createdBy', 'createdBy');

    if (status) {
      queryBuilder.where('task.status = :status', { status });
    }

    queryBuilder.orderBy('task.created_at', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Find a single training announcement by ID
   * @param id - Training announcement ID
   * @returns Training announcement
   */
  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!task) {
      throw new NotFoundException(`Training announcement with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Update a training announcement (admin only)
   * @param id - Training announcement ID
   * @param updateTaskDto - Update data
   * @param userId - ID of the user updating the announcement
   * @returns Updated training announcement
   */
  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<Task> {
    const task = await this.findOne(id);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.roles.includes(Role.admin);

    // Only admins can update training announcements
    if (!isAdmin) {
      throw new ForbiddenException('Only admin users can update training announcements');
    }

    // Update training announcement
    Object.assign(task, updateTaskDto);

    if (updateTaskDto.dueDate) {
      task.dueDate = new Date(updateTaskDto.dueDate);
    }

    if (updateTaskDto.startDate) {
      task.startDate = new Date(updateTaskDto.startDate);
    }

    return await this.taskRepository.save(task);
  }

  /**
   * Delete a training announcement (admin only)
   * @param id - Training announcement ID
   * @param adminId - ID of the admin deleting the announcement
   */
  async remove(id: number, adminId: number): Promise<void> {
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    if (!admin || !admin.roles.includes(Role.admin)) {
      throw new ForbiddenException('Only admin users can delete training announcements');
    }

    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  /**
   * Find training announcements created by a specific admin
   * @param adminId - Admin ID
   * @returns Array of training announcements
   */
  async findTasksCreatedByAdmin(adminId: number): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { createdBy: { id: adminId } },
      relations: ['createdBy'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get training announcement statistics (admin only)
   * @returns Training announcement statistics
   */
  async getTaskStats(): Promise<any> {
    const totalTasks = await this.taskRepository.count();
    const pendingTasks = await this.taskRepository.count({ where: { status: TaskStatus.Pending } });
    const inProgressTasks = await this.taskRepository.count({ where: { status: TaskStatus.InProgress } });
    const completedTasks = await this.taskRepository.count({ where: { status: TaskStatus.Completed } });

    return {
      total: totalTasks,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  /**
   * Get expiring training announcements (within 7 days)
   * @returns Expiring training announcements
   */
  async getExpiringTasks(): Promise<any> {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .where('task.dueDate <= :sevenDaysFromNow', { sevenDaysFromNow })
      .andWhere('task.status != :completedStatus', { completedStatus: TaskStatus.Completed })
      .getMany();

    return expiringTasks;
  }

  /**
   * Mark a training as complete
   * @param id - Training ID
   * @param userId - User ID marking the training as complete
   * @returns Updated training
   */
  async markAsComplete(id: number, userId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!task) {
      throw new NotFoundException(`Training with ID ${id} not found`);
    }

    // Update task status to completed
    task.status = TaskStatus.Completed;
    task.isCompleted = true;

    return await this.taskRepository.save(task);
  }
}
