import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { User } from '../users/entities/user.entity';
import { MANAGER_ROLES, Role } from '../users/enums/role.enum';
import { CreateConversationDto, ListConversationsQueryDto, ListMessagesQueryDto } from './dto/conversation.dto';
import { Conversation, ConversationMessage, ConversationParticipant } from './entities/conversation.entity';

export interface Actor {
  id: number;
  roles?: Role[];
}

const isManager = (a: Actor) => MANAGER_ROLES.some((r) => a.roles?.includes(r));
const USER_SELECT = ['id', 'firstName', 'lastName', 'roles'] as const;

/** Conversations (A2). Only participants can read or post, whatever their role. */
@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant) private readonly partRepo: Repository<ConversationParticipant>,
    @InjectRepository(ConversationMessage) private readonly msgRepo: Repository<ConversationMessage>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notifications: NotificationsService,
    @Optional() private readonly realtime?: RealtimeGateway,
  ) {}

  // ---------- participants ----------

  /** Employee without recipient: all active SST managers; falls back to admins when there are none. */
  private async resolveParticipants(dto: CreateConversationDto, actor: Actor): Promise<number[]> {
    if (dto.recipientId !== undefined) {
      if (dto.recipientId === actor.id) throw new BadRequestException('You cannot start a conversation with yourself');
      const recipient = await this.userRepo.findOne({ where: { id: dto.recipientId }, select: ['id', 'roles', 'isActive'] });
      if (!recipient || !recipient.isActive || !recipient.roles?.length || recipient.roles.includes(Role.PENDING)) {
        throw new BadRequestException('recipientId must reference an active user');
      }
      // Employees talk to the SST team only
      if (!isManager(actor) && !MANAGER_ROLES.some((r) => recipient.roles.includes(r))) {
        throw new ForbiddenException('Employees can only message SST managers');
      }
      return [actor.id, recipient.id];
    }
    if (isManager(actor)) throw new BadRequestException('recipientId is required');

    const active = await this.userRepo.find({ where: { isActive: true }, select: ['id', 'roles'] });
    let targets = active.filter((u) => u.roles?.includes(Role.SST_MANAGER));
    if (!targets.length) targets = active.filter((u) => u.roles?.includes(Role.ADMIN));
    if (!targets.length) throw new BadRequestException('No SST manager is available to receive this message');
    return [actor.id, ...targets.map((u) => u.id)];
  }

  async create(dto: CreateConversationDto, actor: Actor) {
    const ids = [...new Set(await this.resolveParticipants(dto, actor))];
    const now = new Date();
    const { conversation, message } = await this.convRepo.manager.transaction(async (em) => {
      const conv = await em.save(em.create(Conversation, { subject: dto.subject, createdById: actor.id }));
      await em.save(
        ids.map((userId) => em.create(ConversationParticipant, { conversationId: conv.id, userId, lastReadAt: userId === actor.id ? now : null })),
      );
      const msg = await em.save(em.create(ConversationMessage, { conversationId: conv.id, senderId: actor.id, body: dto.body }));
      return { conversation: conv, message: msg };
    });
    await this.dispatch(conversation, message, ids, actor.id);
    return this.findOne(conversation.id, actor);
  }

  // ---------- reads ----------

  private async assertParticipant(conversationId: number, userId: number): Promise<ConversationParticipant> {
    const p = await this.partRepo.findOne({ where: { conversationId, userId } });
    // 404 rather than 403: do not reveal other people's conversations
    if (!p) throw new NotFoundException('Conversation not found');
    return p;
  }

  async findAll(q: ListConversationsQueryDto, actor: Actor) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const [rows, total] = await this.partRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.conversation', 'c')
      .where('p.userId = :me', { me: actor.id })
      .orderBy('c.updatedAt', 'DESC')
      .addOrderBy('c.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data: await this.present(rows, actor.id), total, page, limit };
  }

  async findOne(id: number, actor: Actor) {
    const p = await this.assertParticipant(id, actor.id);
    p.conversation = await this.convRepo.findOneOrFail({ where: { id } });
    return (await this.present([p], actor.id))[0];
  }

  /** Messages sorted oldest first; `page` walks forward through the thread. */
  async listMessages(id: number, q: ListMessagesQueryDto, actor: Actor) {
    await this.assertParticipant(id, actor.id);
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const [rows, total] = await this.msgRepo
      .createQueryBuilder('m')
      .leftJoin('m.sender', 's')
      .addSelect(USER_SELECT.map((f) => `s.${f}`))
      .where('m.conversationId = :id', { id })
      .orderBy('m.createdAt', 'ASC')
      .addOrderBy('m.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data: rows.map((m) => this.presentMessage(m)), total, page, limit };
  }

  async postMessage(id: number, body: string, actor: Actor) {
    await this.assertParticipant(id, actor.id);
    const message = await this.msgRepo.save(this.msgRepo.create({ conversationId: id, senderId: actor.id, body }));
    await this.convRepo.update(id, { updatedAt: new Date() });
    // The sender has obviously read the thread up to now
    await this.partRepo.update({ conversationId: id, userId: actor.id }, { lastReadAt: new Date() });
    const conversation = await this.convRepo.findOneOrFail({ where: { id } });
    const participants = await this.partRepo.find({ where: { conversationId: id } });
    return this.dispatch(conversation, message, participants.map((p) => p.userId), actor.id);
  }

  async markRead(id: number, actor: Actor): Promise<{ read: true; lastReadAt: Date }> {
    const p = await this.assertParticipant(id, actor.id);
    p.lastReadAt = new Date();
    await this.partRepo.save(p);
    return { read: true, lastReadAt: p.lastReadAt };
  }

  // ---------- helpers ----------

  /** Realtime event to all participants + persisted notification to the others. */
  private async dispatch(conversation: Conversation, message: ConversationMessage, participantIds: number[], senderId: number) {
    const sender = await this.userRepo.findOne({ where: { id: senderId }, select: [...USER_SELECT] });
    const presented = this.presentMessage({ ...message, sender } as ConversationMessage);
    const payload = { conversationId: conversation.id, message: presented };
    this.realtime?.emitToUsers(participantIds, 'message:new', payload);
    const others = participantIds.filter((id) => id !== senderId);
    const name = sender ? `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim() : 'PROSAFE';
    await this.notifications.notifyUsers(others, {
      type: NotificationType.MESSAGE,
      title: `Nouveau message de ${name}`.slice(0, 200),
      body: `${conversation.subject}: ${message.body}`.slice(0, 200),
      data: { conversationId: conversation.id, messageId: message.id },
    });
    return presented;
  }

  private presentMessage(m: ConversationMessage) {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      sender: m.sender ? { id: m.sender.id, firstName: m.sender.firstName, lastName: m.sender.lastName } : null,
      body: m.body,
      createdAt: m.createdAt,
    };
  }

  /** Builds `{ id, subject, participants[], lastMessage, unreadCount, updatedAt }` for the viewer. */
  private async present(myParts: ConversationParticipant[], me: number) {
    if (!myParts.length) return [];
    const ids = myParts.map((p) => p.conversationId);

    const allParts = await this.partRepo.find({ where: { conversationId: In(ids) }, relations: ['user'] });
    const byConv = new Map<number, ConversationParticipant[]>();
    for (const p of allParts) byConv.set(p.conversationId, [...(byConv.get(p.conversationId) ?? []), p]);

    const lastRows: ConversationMessage[] = await this.msgRepo
      .createQueryBuilder('m')
      .distinctOn(['m.conversationId'])
      .where('m.conversationId IN (:...ids)', { ids })
      .orderBy('m.conversationId')
      .addOrderBy('m.createdAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .getMany();
    const lastBy = new Map(lastRows.map((m) => [m.conversationId, m]));

    const unreadRows: { conversationId: number; count: string }[] = await this.msgRepo
      .createQueryBuilder('m')
      .innerJoin(ConversationParticipant, 'p', 'p.conversationId = m.conversationId AND p.userId = :me', { me })
      .select('m.conversationId', 'conversationId')
      .addSelect('COUNT(*)', 'count')
      .where('m.conversationId IN (:...ids)', { ids })
      .andWhere('(m.senderId IS NULL OR m.senderId != :me)', { me })
      .andWhere('(p.lastReadAt IS NULL OR m.createdAt > p.lastReadAt)')
      .groupBy('m.conversationId')
      .getRawMany();
    const unreadBy = new Map(unreadRows.map((r) => [Number(r.conversationId), Number(r.count)]));

    return myParts.map((mp) => {
      const c = mp.conversation;
      const last = lastBy.get(c.id);
      return {
        id: c.id,
        subject: c.subject,
        participants: (byConv.get(c.id) ?? []).map((p) => ({ id: p.userId, firstName: p.user?.firstName, lastName: p.user?.lastName, roles: p.user?.roles })),
        lastMessage: last ? { id: last.id, body: last.body, senderId: last.senderId, createdAt: last.createdAt } : null,
        unreadCount: unreadBy.get(c.id) ?? 0,
        updatedAt: c.updatedAt,
      };
    });
  }
}
