import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, AssignTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './enum/task-status.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

/**
 * Tasks Controller
 * Handles task management with admin-only creation and assignment
 * Standard users can view and update their assigned tasks
 */
@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * Create a new task (admin only)
   * POST /tasks
   * @param createTaskDto - Task creation data
   * @param req - Request object containing admin user info
   * @returns Created task
   */
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(EmailVerifiedGuard)
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const task = await this.tasksService.create(createTaskDto, userId);

    return {
      message: 'Task created successfully',
      task,
    };
  }

  /**
   * Get all training announcements
   * GET /tasks
   * @param req - Request object containing user info
   * @returns All training announcements
   */
  @Get()
  async findAll(@Request() req?) {
    const tasks = await this.tasksService.findAll();

    return {
      message: 'Training announcements retrieved successfully',
      tasks,
      count: tasks.length,
    };
  }

  /**
   * Get tasks created by current admin
   * GET /tasks/created-by-me
   * @param req - Request object containing admin user info
   * @returns Tasks created by admin
   */
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Get('created-by-me')
  @UseGuards(EmailVerifiedGuard)
  async getTasksCreatedByMe(@Request() req) {
    const adminId = req.user?.id;

    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }

    const tasks = await this.tasksService.findTasksCreatedByAdmin(adminId);

    return {
      message: 'Tasks created by you retrieved successfully',
      tasks,
      count: tasks.length,
    };
  }

  /**
   * Get trainings for the current user
   * GET /tasks/user/me
   * @param req - Request object containing user info
   * @returns User's trainings
   */
  @Get('user/me')
  @UseGuards(EmailVerifiedGuard)
  async getUserTrainings(@Request() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const tasks = await this.tasksService.findAll();

    return {
      message: 'User trainings retrieved successfully',
      tasks,
      count: tasks.length,
    };
  }

  /**
   * Get task statistics (admin only)
   * GET /tasks/stats
   * @param req - Request object containing admin user info
   * @returns Task statistics
   */
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Get('stats')
  @UseGuards(EmailVerifiedGuard)
  async getTaskStats(@Request() req) {

    const stats = await this.tasksService.getTaskStats();

    return {
      message: 'Task statistics retrieved successfully',
      stats,
    };
  }

  /**
   * Get expiring training announcements
   * GET /tasks/expiring
   * @param req - Request object containing user info
   * @returns Expiring training announcements
   */
  @Get('expiring')
  @UseGuards(EmailVerifiedGuard)
  async getExpiringTasks(@Request() req) {
    const expiringTasks = await this.tasksService.getExpiringTasks();

    return {
      message: 'Expiring training announcements retrieved successfully',
      expiringTasks,
    };
  }

  /**
   * Get a specific training announcement by ID
   * GET /tasks/:id
   * @param id - Training announcement ID
   * @param req - Request object containing user info
   * @returns Training announcement details
   */
  @Get(':id')
  @UseGuards(EmailVerifiedGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const task = await this.tasksService.findOne(id);

    return {
      message: 'Training announcement retrieved successfully',
      task,
    };
  }

  /**
   * Update a training announcement
   * PATCH /tasks/:id
   * @param id - Training announcement ID
   * @param updateTaskDto - Update data
   * @param req - Request object containing user info
   * @returns Updated training announcement
   */
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Patch(':id')
  @UseGuards(EmailVerifiedGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const updatedTask = await this.tasksService.update(id, updateTaskDto, userId);

    return {
      message: 'Training announcement updated successfully',
      task: updatedTask,
    };
  }

  /**
   * Mark a training as complete
   * PATCH /tasks/:id/complete
   * @param id - Training ID
   * @param req - Request object containing user info
   * @returns Success message
   */
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Patch(':id/complete')
  @UseGuards(EmailVerifiedGuard)
  async completeTask(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    await this.tasksService.markAsComplete(id, userId);

    return {
      message: 'Training marked as complete successfully',
    };
  }

  /**
   * Delete a training announcement (admin only)
   * DELETE /tasks/:id
   * @param id - Training announcement ID
   * @param req - Request object containing admin user info
   * @returns Success message
   */
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Delete(':id')
  @UseGuards(EmailVerifiedGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    await this.tasksService.remove(id, userId);

    return {
      message: 'Training announcement deleted successfully',
    };
  }
}
