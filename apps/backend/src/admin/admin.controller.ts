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
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersDTO as CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { UpdateTaskDto } from '../tasks/dto/update-task.dto';
import { CreateMessageDto, UpdateMessageDto } from '../messages/dto/message.dto';
import { CreateInventoryDto } from '../inventory/dto/create-inventory.dto';
import { UpdateInventoryDto } from '../inventory/dto/update-inventory.dto';
import { UpdateIncidentStatusDto } from '../incidents/dto/update-incident-status.dto';
import { CreateAlertDto } from '../alerts/dto/create-alert.dto';
import { UpdateAlertDto } from '../alerts/dto/update-alert.dto';
import { CreateIncidentDto } from '../incidents/dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { Role } from '../users/enums/role.enum';

/**
 * Admin Controller
 * Handles all admin-specific routes with /admin prefix
 */
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard Stats
  @Get('dashboard/stats')
  async getDashboardStats(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }

    // Check if user is admin
    if (!req.user.roles.includes(Role.admin)) {
      throw new ForbiddenException('Admin access required');
    }

    return await this.adminService.getDashboardStats();
  }

  // User Management
  @Get('users')
  async getUsers(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }

    // Check if user is admin
    if (!req.user.roles.includes(Role.admin)) {
      throw new ForbiddenException('Admin access required');
    }

    return await this.adminService.getUsers();
  }

  @Get('users/:email')
  async getUser(@Param('email') email: string, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }

    // Check if user is admin
    if (!req.user.roles.includes(Role.admin)) {
      throw new ForbiddenException('Admin access required');
    }

    return await this.adminService.getUser(email);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }

    // Check if user is admin
    if (!req.user.roles.includes(Role.admin)) {
      throw new ForbiddenException('Admin access required');
    }

    return await this.adminService.createUser(createUserDto, adminId);
  }

  @Patch('users/:email')
  async updateUser(@Param('email') email: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.updateUser(email, updateUserDto, adminId);
  }

  @Delete('users/:email')
  async deleteUser(@Param('email') email: string, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.deleteUser(email, adminId);
  }

  // Task Management
  @Get('tasks')
  async getTasks(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getTasks();
  }

  @Get('tasks/:id')
  async getTask(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getTask(id);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.createTask(createTaskDto, adminId);
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.updateTask(id, updateTaskDto, adminId);
  }

  @Delete('tasks/:id')
  async deleteTask(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.deleteTask(id, adminId);
  }

  // Message Management
  @Get('messages')
  async getMessages(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getMessages();
  }

  @Get('messages/unread')
  async getUnreadMessages(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getUnreadMessages();
  }

  @Get('messages/latest-received')
  async getLatestMessages(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getLatestMessages();
  }

  @Get('messages/:id')
  async getMessage(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getMessage(id);
  }

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.createMessage(createMessageDto, adminId);
  }

  @Patch('messages/:id')
  async updateMessage(@Param('id', ParseIntPipe) id: number, @Body() updateMessageDto: UpdateMessageDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.updateMessage(id, updateMessageDto, adminId);
  }

  @Patch('messages/:id/read')
  async markMessageAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.markMessageAsRead(id, adminId);
  }

  @Patch('messages/:id/archive')
  async archiveMessage(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.archiveMessage(id, adminId);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.deleteMessage(id, adminId);
  }

  // Inventory Management
  @Get('inventory')
  async getInventory(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getInventory(page, limit, category, status);
  }

  @Get('inventory/stats')
  async getInventoryStats(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getInventoryStats();
  }

  @Get('inventory/low-stock')
  async getLowStockItems(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getLowStockItems();
  }

  @Get('inventory/:id')
  async getInventoryItem(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getInventoryItem(id);
  }

  @Post('inventory')
  @HttpCode(HttpStatus.CREATED)
  async createInventoryItem(@Body() createInventoryDto: CreateInventoryDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.createInventoryItem(createInventoryDto, adminId);
  }

  @Patch('inventory/:id')
  async updateInventoryItem(@Param('id', ParseIntPipe) id: number, @Body() updateInventoryDto: UpdateInventoryDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.updateInventoryItem(id, updateInventoryDto, adminId);
  }

  @Delete('inventory/:id')
  async deleteInventoryItem(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.deleteInventoryItem(id, adminId);
  }

  // Incident Management
  @Get('incidents')
  async getIncidents(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getIncidents();
  }

  @Get('incidents/:id')
  async getIncident(@Param('id') id: string, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getIncident(id);
  }

  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  async createIncident(@Body() createIncidentDto: CreateIncidentDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.createIncident(createIncidentDto, adminId);
  }

  @Patch('incidents/:id/status')
  async updateIncidentStatus(@Param('id') id: string, @Body() updateIncidentStatusDto: UpdateIncidentStatusDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.updateIncidentStatus(id, updateIncidentStatusDto, adminId);
  }

  // Alert Management
  @Get('alerts')
  async getAlerts(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getAlerts(page, limit, severity, status);
  }

  @Get('alerts/stats')
  async getAlertStats(@Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getAlertStats();
  }

  @Get('alerts/:id')
  async getAlert(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.getAlert(id);
  }

  @Post('alerts')
  @HttpCode(HttpStatus.CREATED)
  async createAlert(@Body() createAlertDto: CreateAlertDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.createAlert(createAlertDto, adminId);
  }

  @Patch('alerts/:id')
  async updateAlert(@Param('id', ParseIntPipe) id: number, @Body() updateAlertDto: UpdateAlertDto, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.updateAlert(id, updateAlertDto, adminId);
  }

  @Delete('alerts/:id')
  async deleteAlert(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('User not authenticated');
    }
    return await this.adminService.deleteAlert(id, adminId);
  }
}
