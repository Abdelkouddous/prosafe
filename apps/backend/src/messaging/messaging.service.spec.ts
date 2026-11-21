import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { ConversationParticipant } from './entities/conversation.entity';
import { Role } from '../users/enums/role.enum';

describe('MessagingService', () => {
  let service: MessagingService;
  let convRepo: any, partRepo: any, msgRepo: any, userRepo: any, notifications: any, realtime: any, em: any;
  const employee = { id: 10, roles: [Role.EMPLOYEE] };
  const manager = { id: 1, roles: [Role.SST_MANAGER] };

  beforeEach(() => {
    em = {
      create: jest.fn((_c, d) => ({ ...d })),
      save: jest.fn(async (x) => (Array.isArray(x) ? x : { id: 100, createdAt: new Date(), ...x })),
    };
    convRepo = { manager: { transaction: jest.fn(async (cb) => cb(em)) }, findOneOrFail: jest.fn().mockResolvedValue({ id: 100, subject: 's', updatedAt: new Date() }), update: jest.fn() };
    partRepo = { findOne: jest.fn(), find: jest.fn().mockResolvedValue([]), update: jest.fn(), save: jest.fn(async (x) => x) };
    msgRepo = { create: jest.fn((x) => x), save: jest.fn(async (x) => ({ id: 5, createdAt: new Date(), ...x })), createQueryBuilder: jest.fn() };
    userRepo = { find: jest.fn(), findOne: jest.fn().mockResolvedValue({ id: 10, firstName: 'E', lastName: 'M', roles: [Role.EMPLOYEE] }) };
    notifications = { notifyUsers: jest.fn() };
    realtime = { emitToUsers: jest.fn() };
    service = new MessagingService(convRepo, partRepo, msgRepo, userRepo, notifications, realtime);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 100 } as any);
  });

  const participantIds = () => em.create.mock.calls.filter(([c]) => c === ConversationParticipant).map(([, d]) => d.userId);

  describe('create', () => {
    it('employee without recipient: creator + all active sst_managers', async () => {
      userRepo.find.mockResolvedValue([
        { id: 1, roles: [Role.SST_MANAGER] },
        { id: 2, roles: [Role.SST_MANAGER] },
        { id: 3, roles: [Role.ADMIN] },
        { id: 10, roles: [Role.EMPLOYEE] },
      ]);
      await service.create({ subject: 's', body: 'b' }, employee);
      expect(participantIds()).toEqual([10, 1, 2]);
      expect(notifications.notifyUsers).toHaveBeenCalledWith([1, 2], expect.objectContaining({ type: 'message' }));
      expect(realtime.emitToUsers).toHaveBeenCalledWith([10, 1, 2], 'message:new', expect.objectContaining({ conversationId: 100 }));
    });

    it('falls back to admins when there is no sst_manager', async () => {
      userRepo.find.mockResolvedValue([{ id: 3, roles: [Role.ADMIN] }, { id: 10, roles: [Role.EMPLOYEE] }]);
      await service.create({ subject: 's', body: 'b' }, employee);
      expect(participantIds()).toEqual([10, 3]);
    });

    it('400 when nobody can receive; managers must give a recipient', async () => {
      userRepo.find.mockResolvedValue([{ id: 10, roles: [Role.EMPLOYEE] }]);
      await expect(service.create({ subject: 's', body: 'b' }, employee)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.create({ subject: 's', body: 'b' }, manager)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('employees can only target managers', async () => {
      userRepo.findOne.mockResolvedValue({ id: 11, roles: [Role.EMPLOYEE], isActive: true });
      await expect(service.create({ subject: 's', body: 'b', recipientId: 11 }, employee)).rejects.toBeInstanceOf(ForbiddenException);
      userRepo.findOne.mockResolvedValue({ id: 1, roles: [Role.SST_MANAGER], isActive: true });
      await service.create({ subject: 's', body: 'b', recipientId: 1 }, employee);
      expect(participantIds()).toEqual([10, 1]);
    });
  });

  describe('access control', () => {
    it('non-participants (even managers) get 404 on read, post and mark-read', async () => {
      partRepo.findOne.mockResolvedValue(null);
      await expect(service.listMessages(5, {}, manager)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.postMessage(5, 'hi', manager)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.markRead(5, manager)).rejects.toBeInstanceOf(NotFoundException);
      expect(msgRepo.save).not.toHaveBeenCalled();
    });

    it('a participant posting notifies only the others and emits to everyone', async () => {
      partRepo.findOne.mockResolvedValue({ conversationId: 5, userId: 10 });
      partRepo.find.mockResolvedValue([{ userId: 10 }, { userId: 1 }]);
      await service.postMessage(5, 'hello', employee);
      expect(notifications.notifyUsers).toHaveBeenCalledWith([1], expect.anything());
      expect(realtime.emitToUsers).toHaveBeenCalledWith([10, 1], 'message:new', expect.anything());
    });

    it('markRead stamps lastReadAt', async () => {
      const p: any = { conversationId: 5, userId: 10, lastReadAt: null };
      partRepo.findOne.mockResolvedValue(p);
      const res = await service.markRead(5, employee);
      expect(res.read).toBe(true);
      expect(p.lastReadAt).toBeInstanceOf(Date);
    });
  });

  it('findAll returns participants, lastMessage and the per-user unreadCount', async () => {
    const chain = (extra: any) => {
      const q: any = {};
      for (const m of ['innerJoinAndSelect', 'innerJoin', 'where', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take', 'distinctOn', 'select', 'addSelect', 'groupBy']) q[m] = jest.fn().mockReturnValue(q);
      return Object.assign(q, extra);
    };
    const conv = { id: 5, subject: 'Sujet', updatedAt: new Date() };
    partRepo.createQueryBuilder = jest.fn().mockReturnValue(chain({ getManyAndCount: jest.fn().mockResolvedValue([[{ conversationId: 5, userId: 10, conversation: conv }], 1]) }));
    partRepo.find.mockResolvedValue([
      { conversationId: 5, userId: 10, user: { firstName: 'E', lastName: 'M', roles: [Role.EMPLOYEE] } },
      { conversationId: 5, userId: 1, user: { firstName: 'S', lastName: 'M', roles: [Role.SST_MANAGER] } },
    ]);
    msgRepo.createQueryBuilder = jest
      .fn()
      .mockReturnValueOnce(chain({ getMany: jest.fn().mockResolvedValue([{ id: 9, conversationId: 5, body: 'last', senderId: 1, createdAt: new Date() }]) }))
      .mockReturnValueOnce(chain({ getRawMany: jest.fn().mockResolvedValue([{ conversationId: 5, count: '2' }]) }));
    const res = await service.findAll({}, employee);
    expect(res.total).toBe(1);
    expect(res.data[0]).toMatchObject({ id: 5, unreadCount: 2, lastMessage: { body: 'last' } });
    expect(res.data[0].participants.map((p) => p.id)).toEqual([10, 1]);
  });
});
