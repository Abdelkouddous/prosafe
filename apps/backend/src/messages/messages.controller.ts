import { Controller, Get, Post, Patch, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, type AdminMessageDTO } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { Role } from '../users/enums/role.enum';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Creates a new message.
   * The sender_id is automatically set to the ID of the authenticated user.
   * @param createMessageDto - The data to create the message.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to the created message.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createMessageDto: CreateMessageDto, @Req() req) {
    // Set the sender_id to the current user's id
    createMessageDto.sender_id = req.user.id;
    return this.messagesService.create(createMessageDto);
  }

  /**
   * Retrieves all messages.
   * Admins can see all messages.
   * Regular users can only see messages they have sent.
   * @param req - The request object, used to access the authenticated user and their roles.
   * @returns A promise that resolves to an array of messages.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req) {
    // Only admins can see all messages
    if (req.user.roles.includes(Role.admin)) {
      return this.messagesService.findAll();
    } else {
      // Regular users can only see their own messages
      // return this.messagesService.findAllBySenderId(req.user.id);
      // regular users see all admin messages
      return this.messagesService.findAll();
    }
  }

  /**
   * Retrieves the latest received messages (e.g., for an admin dashboard).
   * Only accessible by admins.
   * @param req - The request object, used to access the authenticated user and their roles.
   * @returns A promise that resolves to an array of the latest messages.
   * @throws Error if the user is not an admin.
   */
  @UseGuards(JwtAuthGuard)
  @Get('latest-received')
  async findLatestReceived(@Req() req) {
    if (req.user.roles.includes(Role.admin)) {
      return this.messagesService.findLatestReceived(); // Default limit is 5, can be parameterized if needed
    } else {
      throw new Error('Forbidden: Admin access required');
    }
  }

  /**
   * Retrieves all unread messages.
   * Only admins can see unread messages
   * @param req - The request object, used to access the authenticated user and their roles.
   * @returns A promise that resolves to an array of messages.
   */
  @UseGuards(JwtAuthGuard)
  @Get('unread')
  async findAllUnread(@Req() req) {
    // Only admins can see unread messages
    if (req.user.roles.includes(Role.admin)) {
      return this.messagesService.findAllUnread();
    } else {
      throw new Error('Forbidden: Admin access required');
    }
  }

  /**
   * Retrieves a message.
   * @param id - The id of the message to retrieve.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to the message.
   * @throws Error if the user does not have permission to view the message.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const message = await this.messagesService.findOne(+id);

    // Check if the user is the sender or an admin
    if (message.sender_id === req.user.id || req.user.roles.includes(Role.admin)) {
      return message;
    } else {
      throw new Error('Forbidden: You do not have permission to view this message');
    }
  }

  /**
   * Updates an existing message.
   * @param id - The id of the message to update.
   * @param updateMessageDto - The data to update the message.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to void.
   * @throws Error if the user does not have permission to update the message.
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto, @Req() req) {
    const message = await this.messagesService.findOne(+id);

    // Check if the user is the sender or an admin
    if (message.sender_id === req.user.id || req.user.roles.includes(Role.admin)) {
      return this.messagesService.update(+id, updateMessageDto);
    } else {
      throw new Error('Forbidden: You do not have permission to update this message');
    }
  }

  /**
   * Marks a message as read.
   * Only admins can mark messages as read
   * @param id - The id of the message to mark as read.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to void.
   * @throws Error if the user does not have permission to mark the message as read.
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req) {
    // Only admins can mark messages as read
    if (req.user.roles.includes(Role.admin)) {
      return this.messagesService.markAsRead(+id);
    } else {
      throw new Error('Forbidden: Admin access required');
    }
  }

  /**
   * Marks a message as archived.
   * Only admins can archive messages
   * @param id - The id of the message to archive.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to void.
   * @throws Error if the user does not have permission to archive the message.
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id/archive')
  async markAsArchived(@Param('id') id: string, @Req() req) {
    // Only admins can archive messages
    if (req.user.roles.includes(Role.admin)) {
      return this.messagesService.markAsArchived(+id);
    } else {
      throw new Error('Forbidden: Admin access required');
    }
  }

  /**
   * Deletes a message.
   * @param id - The id of the message to delete.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to void.
   * @throws Error if the user does not have permission to delete the message.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const message = await this.messagesService.findOne(+id);

    // Check if the user is the sender or an admin
    if (message.sender_id === req.user.id || req.user.roles.includes(Role.admin)) {
      return this.messagesService.remove(+id);
    } else {
      throw new Error('Forbidden: You do not have permission to delete this message');
    }
  }
  /**
   * Retrieves all messages received by the current user (inbox).
   * Users can see messages sent to them by admins.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to an array of messages received by the user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-messages')
  async findMyMessages(@Req() req) {
    return this.messagesService.findAllForUser(req.user.id);
  }

  /**
   * Marks a received message as read by the current user.
   * @param id - The id of the message to mark as read.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to void.
   * @throws Error if the user is not the recipient of the message.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markMyMessageAsRead(@Param('id') id: string, @Req() req) {
    const message = await this.messagesService.findOne(+id);

    // Check if the user is the recipient of the message
    if (message.recipient_id === req.user.id) {
      return this.messagesService.markAsRead(+id);
    } else {
      throw new Error('Forbidden: You can only mark your own messages as read');
    }
  }

  /**
   * Archives a received message for the current user.
   * @param id - The id of the message to archive.
   * @param req - The request object, used to access the authenticated user.
   * @returns A promise that resolves to void.
   * @throws Error if the user is not the recipient of the message.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/archive')
  async archiveMyMessage(@Param('id') id: string, @Req() req) {
    const message = await this.messagesService.findOne(+id);

    // Check if the user is the recipient of the message
    if (message.recipient_id === req.user.id) {
      return this.messagesService.markAsArchived(+id);
    } else {
      throw new Error('Forbidden: You can only archive your own messages');
    }
  }
}
