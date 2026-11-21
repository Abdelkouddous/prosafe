import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CorrectiveActionSource, CorrectiveActionStatus } from './enums/corrective-action.enums';
import { Role } from '../users/enums/role.enum';

const makeQb = (data: any[] = []) => {
  const qb: any = { wheres: [] as string[] };
  for (const m of ['leftJoin', 'addSelect', 'orderBy', 'addOrderBy', 'skip', 'take']) qb[m] = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn((sql: string) => (qb.wheres.push(sql), qb));
  qb.getManyAndCount = jest.fn().mockResolvedValue([data, data.length]);
  return qb;
};

describe('CorrectiveActionsService', () => {
  let service: CorrectiveActionsService;
  let repo: any, incidentRepo: any, userRepo: any, notifications: any;
  const manager = { id: 1, roles: [Role.SST_MANAGER] };
  const owner = { id: 7, roles: [Role.EMPLOYEE] };
  const stranger = { id: 8, roles: [Role.EMPLOYEE] };
  const action = (extra = {}) => ({ id: 3, sourceType: 'incident', sourceId: 1, title: 'Fix', ownerId: 7, status: CorrectiveActionStatus.TODO, doneAt: null, ...extra });

  beforeEach(() => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 3, ...x })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };
    incidentRepo = { count: jest.fn().mockResolvedValue(1) };
    userRepo = { findOne: jest.fn().mockResolvedValue({ id: 7, roles: [Role.EMPLOYEE], isActive: true }) };
    notifications = { notifyUsers: jest.fn(), notifyUsersOnce: jest.fn(), notifyRolesOnce: jest.fn() };
    service = new CorrectiveActionsService(repo, incidentRepo, userRepo, notifications);
  });

  describe('create', () => {
    const dto: any = { sourceType: CorrectiveActionSource.INCIDENT, sourceId: 1, title: 'Fix', ownerId: 7 };

    it('notifies the owner on assignment', async () => {
      await service.create(dto, manager);
      expect(notifications.notifyUsers).toHaveBeenCalledWith([7], expect.objectContaining({ data: expect.objectContaining({ correctiveActionId: 3 }) }));
    });

    it('validates incident existence but not risk / audit sources', async () => {
      incidentRepo.count.mockResolvedValue(0);
      await expect(service.create(dto, manager)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.create({ ...dto, sourceType: CorrectiveActionSource.RISK, sourceId: 999 }, manager)).resolves.toBeDefined();
      expect(incidentRepo.count).toHaveBeenCalledTimes(1);
    });

    it('rejects an inactive / pending owner', async () => {
      userRepo.findOne.mockResolvedValue({ id: 7, roles: [Role.PENDING], isActive: true });
      await expect(service.create(dto, manager)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('ownership', () => {
    it('employees list only their own actions', async () => {
      const qb = makeQb();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({}, owner);
      expect(qb.wheres).toContain('a.ownerId = :me');
    });

    it('a non-owner employee gets 404', async () => {
      repo.findOne.mockResolvedValue(action());
      await expect(service.findOne(3, stranger)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('the owner may update status (doneAt set) but nothing else', async () => {
      repo.findOne.mockResolvedValue(action());
      const res = await service.update(3, { status: CorrectiveActionStatus.DONE }, owner);
      expect(res.status).toBe('done');
      expect(res.doneAt).toBeInstanceOf(Date);
      await expect(service.update(3, { title: 'x' }, owner)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('re-assigning notifies the new owner', async () => {
      repo.findOne.mockResolvedValue(action());
      userRepo.findOne.mockResolvedValue({ id: 9, roles: [Role.EMPLOYEE], isActive: true });
      await service.update(3, { ownerId: 9 }, manager);
      expect(notifications.notifyUsers).toHaveBeenCalledWith([9], expect.anything());
    });
  });

  describe('overdue cron', () => {
    it('notifies owner and managers once per action (dedupe keys)', async () => {
      repo.find.mockResolvedValue([{ ...action(), dueDate: new Date('2026-01-01') }, { ...action({ id: 4, ownerId: null }), dueDate: new Date('2026-01-02') }]);
      const n = await service.notifyOverdue(new Date('2026-02-01'));
      expect(n).toBe(2);
      expect(notifications.notifyUsersOnce).toHaveBeenCalledTimes(1);
      expect(notifications.notifyUsersOnce.mock.calls[0][1].data.key).toBe('corrective-overdue:3');
      expect(notifications.notifyRolesOnce).toHaveBeenCalledTimes(2);
    });
  });
});
