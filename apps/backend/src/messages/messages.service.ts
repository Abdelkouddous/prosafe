import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, type AdminMessage } from './entities/message.entity';
import { MessageStatus } from './enums/message-status.enum';
import { CreateMessageDto, UpdateMessageDto } from './dto/message.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity'; // Added import
import { Role } from '../users/enums/role.enum'; // Added import

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
  ) {}

  /**
   * Creates a new message or multiple messages if send_to_all is true.
   * @param createMessageDto - The data to create the message(s).
   * @returns The created message or an array of created messages.
   * @throws Error if sender or recipient (if specified) is not found.
   */
  async create(createMessageDto: CreateMessageDto): Promise<Message | Message[]> {
    let sender = null;
    
    // Only fetch sender if sender_id is provided
    if (createMessageDto.sender_id) {
      sender = await this.usersService.findById(createMessageDto.sender_id);
      if (!sender) {
        throw new Error('Sender not found');
      }
    }

    if (createMessageDto.send_to_all) {
      const users = await this.usersService.findAll();
      const standardUsers = users.filter((user) => user.roles.includes(Role.standard));
      const messages: Message[] = [];
      for (const user of standardUsers) {
        const message = this.messagesRepository.create({
          ...createMessageDto,
          sender,
          recipient: user,
          recipient_id: user.id,
        });
        messages.push(await this.messagesRepository.save(message));
      }
      return messages;
    } else if (createMessageDto.recipient_id) {
      const recipient = await this.usersService.findById(createMessageDto.recipient_id);
      if (!recipient) {
        throw new Error('Recipient not found');
      }
      const message = this.messagesRepository.create({
        ...createMessageDto,
        sender,
        recipient,
        recipient_id: recipient.id,
      });
      return this.messagesRepository.save(message);
    } else {
      // Handle messages without a specific recipient or send_to_all (e.g. general announcements not tied to users)
      // This part might need further clarification based on requirements for messages without recipients
      const message = this.messagesRepository.create({
        ...createMessageDto,
        sender,
      });
      return this.messagesRepository.save(message);
    }
  }

  /**
   * Creates a system message with a system sender name instead of a user
   * @param createMessageDto - The data to create the message(s) with system_sender
   * @returns The created message or an array of created messages
   */
  async createSystemMessage(createMessageDto: CreateMessageDto & { system_sender: string }): Promise<Message | Message[]> {
    if (createMessageDto.send_to_all) {
      const users = await this.usersService.findAll();
      const standardUsers = users.filter((user) => user.roles.includes(Role.standard));
      const messages: Message[] = [];
      for (const user of standardUsers) {
        const message = this.messagesRepository.create({
          subject: createMessageDto.subject,
          content: createMessageDto.content,
          system_sender: createMessageDto.system_sender,
          recipient: user,
          recipient_id: user.id,
          is_urgent: createMessageDto.is_urgent || false,
          status: MessageStatus.UNREAD,
        });
        messages.push(await this.messagesRepository.save(message));
      }
      return messages;
    } else {
      // Handle single system message
      const message = this.messagesRepository.create({
        subject: createMessageDto.subject,
        content: createMessageDto.content,
        system_sender: createMessageDto.system_sender,
        recipient_id: createMessageDto.recipient_id,
        is_urgent: createMessageDto.is_urgent || false,
        status: MessageStatus.UNREAD,
      });
      return this.messagesRepository.save(message);
    }
  }

  /**
   * Retrieves all messages, ordered by creation date (newest first).
   * Includes sender information.
   * @returns A promise that resolves to an array of messages.
   */
  async findAll(): Promise<Message[]> {
    return this.messagesRepository.find({
      relations: ['sender', 'recipient'], // Also include recipient for context
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Retrieves the latest messages up to a specified limit.
   * Useful for dashboards or quick overviews.
   * @param limit - The maximum number of messages to retrieve.
   * @returns A promise that resolves to an array of the latest messages.
   */
  async findLatestReceived(limit: number = 5): Promise<Message[]> {
    return this.messagesRepository.find({
      relations: ['sender', 'recipient'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Retrieves all messages for a specific user (as recipient).
   * @param userId - The user id.
   * @returns A promise that resolves to an array of messages.
   */
  async findAllForUser(userId: number): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { recipient_id: userId },
      relations: ['sender', 'recipient'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllBySenderId(senderId: number): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { sender_id: senderId },
      relations: ['sender'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllUnread(): Promise<Message[]> {
    return this.messagesRepository.find({
      where: { status: MessageStatus.UNREAD },
      relations: ['sender', 'recipient'], // Also include recipient for context
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Retrieves a single message by its ID.
   * @param id - The message id.
   * @returns A promise that resolves to an array of messages.
   */
  async findOne(id: number): Promise<Message> {
    return this.messagesRepository.findOne({
      where: { id },
      relations: ['sender', 'recipient'], // Also include recipient for context
    });
  }

  /**
   * Updates an existing message.
   * @param id - The message id.
   * @param updateMessageDto - The data to update the message.
   * @returns A promise that resolves to the updated message.
   */
  async update(id: number, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const message = await this.findOne(id);
    if (!message) {
      throw new Error('Message not found');
    }

    Object.assign(message, updateMessageDto);
    return this.messagesRepository.save(message);
  }

  async markAsRead(id: number): Promise<Message> {
    const message = await this.findOne(id);
    if (!message) {
      throw new Error('Message not found');
    }

    message.status = MessageStatus.READ;
    return this.messagesRepository.save(message);
  }

  async markAsArchived(id: number): Promise<Message> {
    const message = await this.findOne(id);
    if (!message) {
      throw new Error('Message not found');
    }

    message.status = MessageStatus.ARCHIVED;
    return this.messagesRepository.save(message);
  }

  async remove(id: number): Promise<void> {
    await this.messagesRepository.delete(id);
  }

  //
}
