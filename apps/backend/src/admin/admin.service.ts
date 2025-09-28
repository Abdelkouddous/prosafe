import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TasksService } from '../tasks/tasks.service';
import { MessagesService } from '../messages/messages.service';
import { InventoryService } from '../inventory/inventory.service';
import { IncidentsService } from '../incidents/incidents.service';
import { AlertsService } from '../alerts/alerts.service';
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

/**
 * Admin Service
 * Handles all admin-specific business logic
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tasksService: TasksService,
    private readonly messagesService: MessagesService,
    private readonly inventoryService: InventoryService,
    private readonly incidentsService: IncidentsService,
    private readonly alertsService: AlertsService,
  ) {}

  // Dashboard Stats
  async getDashboardStats() {
    const [totalUsers, totalTasks, totalIncidents, alertStats, inventoryStats, unreadMessages] = await Promise.all([
      this.usersService.findAll().then((users) => users.length),
      this.tasksService.getTaskStats().then((stats) => stats.total),
      this.incidentsService.findAll().then((incidents) => incidents.length),
      this.alertsService.getAlertStats(),
      this.inventoryService.getInventoryStats(),
      this.messagesService.findAllUnread().then((messages) => messages.length),
    ]);

    return {
      alerts: alertStats,
      inventory: inventoryStats,
      messages: { unreadCount: unreadMessages },
      totalUsers,
      totalTasks,
      totalIncidents,
    };
  }

  // User Management
  async getUsers() {
    return await this.usersService.findAll();
  }

  async getUser(email: string) {
    return await this.usersService.findOne(email);
  }

  async createUser(createUserDto: CreateUserDto, adminId: number) {
    return await this.usersService.create(createUserDto);
  }

  async updateUser(email: string, updateUserDto: UpdateUserDto, adminId: number) {
    // Find user by email first to get the ID
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Convert UpdateUserDto to AdminUpdateUserDto format
    const adminUpdateDto = {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      email: updateUserDto.email,
    };

    return await this.usersService.adminUpdateUser(user.id, adminUpdateDto);
  }

  async deleteUser(email: string, adminId: number) {
    return await this.usersService.remove(email);
  }

  // Task Management
  async getTasks() {
    return await this.tasksService.findAll();
  }

  async getTask(id: number) {
    return await this.tasksService.findOne(id);
  }

  async createTask(createTaskDto: CreateTaskDto, adminId: number) {
    return await this.tasksService.create(createTaskDto, adminId);
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto, adminId: number) {
    return await this.tasksService.update(id, updateTaskDto, adminId);
  }

  async deleteTask(id: number, adminId: number) {
    return await this.tasksService.remove(id, adminId);
  }

  // Message Management
  async getMessages() {
    return await this.messagesService.findAll();
  }

  async getUnreadMessages() {
    return await this.messagesService.findAllUnread();
  }

  async getLatestMessages() {
    return await this.messagesService.findLatestReceived();
  }

  async getMessage(id: number) {
    return await this.messagesService.findOne(id);
  }

  async createMessage(createMessageDto: CreateMessageDto, adminId: number) {
    // For admin broadcast messages, use a system sender instead of the actual admin
    if (createMessageDto.send_to_all) {
      const systemMessageDto = {
        ...createMessageDto,
        sender_id: null, // Will be handled specially in messages service
        system_sender: 'Prosafe Admin',
      };
      return await this.messagesService.createSystemMessage(systemMessageDto);
    }

    return await this.messagesService.create(createMessageDto);
  }

  async updateMessage(id: number, updateMessageDto: UpdateMessageDto, adminId: number) {
    return await this.messagesService.update(id, updateMessageDto);
  }

  async markMessageAsRead(id: number, adminId: number) {
    return await this.messagesService.markAsRead(id);
  }

  async archiveMessage(id: number, adminId: number) {
    return await this.messagesService.markAsArchived(id);
  }

  async deleteMessage(id: number, adminId: number) {
    return await this.messagesService.remove(id);
  }

  // Inventory Management
  async getInventory(page: number, limit: number, category?: string, status?: string) {
    return await this.inventoryService.findAll(page, limit, category as any, status as any);
  }

  async getInventoryStats() {
    return await this.inventoryService.getInventoryStats();
  }

  async getLowStockItems() {
    return await this.inventoryService.getLowStockItems();
  }

  async getInventoryItem(id: number) {
    return await this.inventoryService.findOne(id);
  }

  async createInventoryItem(createInventoryDto: CreateInventoryDto, adminId: number) {
    return await this.inventoryService.create(createInventoryDto);
  }

  async updateInventoryItem(id: number, updateInventoryDto: UpdateInventoryDto, adminId: number) {
    return await this.inventoryService.update(id, updateInventoryDto);
  }

  async deleteInventoryItem(id: number, adminId: number) {
    return await this.inventoryService.remove(id);
  }

  // Incident Management
  async getIncidents() {
    return await this.incidentsService.findAll();
  }

  async getIncident(id: string) {
    return await this.incidentsService.findOne(id);
  }

  async createIncident(createIncidentDto: CreateIncidentDto, adminId: number) {
    return await this.incidentsService.create(createIncidentDto, null, adminId);
  }

  async updateIncidentStatus(id: string, data: UpdateIncidentStatusDto, adminId: number) {
    return await this.incidentsService.updateStatus(id, data, adminId);
  }

  // Alert Management
  async getAlerts(page: number, limit: number, severity?: string, status?: string) {
    return await this.alertsService.findAll(page, limit, severity as any, status as any);
  }

  async getAlertStats() {
    return await this.alertsService.getAlertStats();
  }

  async getAlert(id: number) {
    return await this.alertsService.findOne(id);
  }

  async createAlert(createAlertDto: CreateAlertDto, adminId: number) {
    return await this.alertsService.create(createAlertDto);
  }

  async updateAlert(id: number, updateAlertDto: UpdateAlertDto, adminId: number) {
    return await this.alertsService.update(id, updateAlertDto);
  }

  async deleteAlert(id: number, adminId: number) {
    return await this.alertsService.remove(id);
  }
}
