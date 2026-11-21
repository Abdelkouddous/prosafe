import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role, MANAGER_ROLES } from '../users/enums/role.enum';

const isManager = (user: { roles?: Role[] }) => MANAGER_ROLES.some((r) => user.roles?.includes(r));

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Creates a new message. The sender is always the authenticated user.
   * Broadcasting (`send_to_all`) is reserved to admin / sst_manager.
   */
  @Post()
  async create(@Body() createMessageDto: CreateMessageDto, @Req() req) {
    if (createMessageDto.send_to_all && !isManager(req.user)) {
      throw new ForbiddenException('Only admins and SST managers can send to all users');
    }
    createMessageDto.sender_id = req.user.id;
    createMessageDto.system_sender = undefined; // never client-controlled
    return this.messagesService.create(createMessageDto);
  }

  /**
   * Messages sent or received by the current user.
   * Admin / sst_manager may pass `?all=true` to list every message.
   */
  @Get()
  @ApiQuery({ name: 'all', required: false, type: Boolean, description: 'admin / sst_manager only' })
  async findAll(@Req() req, @Query('all') all?: string) {
    if (all === 'true') {
      if (!isManager(req.user)) {
        throw new ForbiddenException('Only admins and SST managers can list all messages');
      }
      return this.messagesService.findAll();
    }
    return this.messagesService.findAllInvolving(req.user.id);
  }

  // ---- Static routes (must stay above ':id') ----

  /** Messages received by the current user (inbox). */
  @Get('my-messages')
  async findMyMessages(@Req() req) {
    return this.messagesService.findAllForUser(req.user.id);
  }

  @Get('latest-received')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  async findLatestReceived() {
    return this.messagesService.findLatestReceived();
  }

  @Get('unread')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  async findAllUnread() {
    return this.messagesService.findAllUnread();
  }

  // ---- Parameterised routes ----

  /** Retrieves a message (sender, recipient or manager). */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const message = await this.messagesService.findOne(id);
    if (message.sender_id === req.user.id || message.recipient_id === req.user.id || isManager(req.user)) {
      return message;
    }
    throw new ForbiddenException('You do not have permission to view this message');
  }

  /** Updates a message (sender or manager). */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateMessageDto: UpdateMessageDto, @Req() req) {
    const message = await this.messagesService.findOne(id);
    if (message.sender_id === req.user.id || isManager(req.user)) {
      return this.messagesService.update(id, updateMessageDto);
    }
    throw new ForbiddenException('You do not have permission to update this message');
  }

  /** Marks any message as read (admin / sst_manager). */
  @Put(':id/read')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.markAsRead(id);
  }

  /** Archives any message (admin / sst_manager). */
  @Put(':id/archive')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  async markAsArchived(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.markAsArchived(id);
  }

  /** Deletes a message (sender or manager). */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const message = await this.messagesService.findOne(id);
    if (message.sender_id === req.user.id || isManager(req.user)) {
      return this.messagesService.remove(id);
    }
    throw new ForbiddenException('You do not have permission to delete this message');
  }

  /** Marks a received message as read by its recipient. */
  @Patch(':id/read')
  async markMyMessageAsRead(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const message = await this.messagesService.findOne(id);
    if (message.recipient_id !== req.user.id) {
      throw new ForbiddenException('You can only mark your own messages as read');
    }
    return this.messagesService.markAsRead(id);
  }

  /** Archives a received message for its recipient. */
  @Patch(':id/archive')
  async archiveMyMessage(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const message = await this.messagesService.findOne(id);
    if (message.recipient_id !== req.user.id) {
      throw new ForbiddenException('You can only archive your own messages');
    }
    return this.messagesService.markAsArchived(id);
  }
}
