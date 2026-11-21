import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { Enrollment } from './entities/enrollment.entity';
import { EnrollmentStatus, SessionStatus } from './enums/training.enums';
import { Role } from '../users/enums/role.enum';

const DAY = 86_400_000;

describe('TrainingsService', () => {
  let service: TrainingsService;
  let trainingRepo: any, sessionRepo: any, enrollmentRepo: any, userRepo: any, notifications: any, em: any, dataSource: any;
  let session: any;

  const qb = (rows: any[], total = rows.length) => {
    const b: any = {};
    ['innerJoinAndSelect', 'innerJoin', 'leftJoinAndSelect', 'where', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take'].forEach((m) => (b[m] = jest.fn(() => b)));
    b.getManyAndCount = jest.fn().mockResolvedValue([rows, total]);
    b.getMany = jest.fn().mockResolvedValue(rows);
    return b;
  };

  beforeEach(() => {
    session = { id: 1, trainingId: 3, status: SessionStatus.PLANNED, startAt: new Date(Date.now() + 5 * DAY), capacity: 2 };
    em = {
      findOne: jest.fn(async (entity, opts) => (entity === Enrollment ? null : session)),
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn(async (_e, x) => x),
      create: jest.fn((_e, x) => x),
    };
    dataSource = { transaction: jest.fn((cb) => cb(em)) };
    trainingRepo = { find: jest.fn().mockResolvedValue([]) };
    sessionRepo = { find: jest.fn().mockResolvedValue([]), createQueryBuilder: jest.fn(() => qb([])) };
    enrollmentRepo = { findOne: jest.fn(), save: jest.fn(async (x) => x), find: jest.fn().mockResolvedValue([]), createQueryBuilder: jest.fn(() => qb([])) };
    userRepo = { find: jest.fn().mockResolvedValue([]) };
    notifications = { notifyUsers: jest.fn(), notifyUsersOnce: jest.fn().mockResolvedValue([1]), notifyRolesOnce: jest.fn().mockResolvedValue([]) };
    service = new TrainingsService(trainingRepo, sessionRepo, enrollmentRepo, userRepo, dataSource, notifications);
  });

  const me = { id: 10, roles: [Role.EMPLOYEE] };

  describe('enroll', () => {
    it('registers the user', async () => {
      const e = await service.enroll(1, me);
      expect(e).toMatchObject({ sessionId: 1, userId: 10, status: EnrollmentStatus.REGISTERED });
    });

    it('409 when the session is full', async () => {
      em.count.mockResolvedValue(2);
      await expect(service.enroll(1, me)).rejects.toBeInstanceOf(ConflictException);
    });

    it('409 when already enrolled', async () => {
      em.findOne.mockImplementation(async (entity) => (entity === Enrollment ? { status: EnrollmentStatus.REGISTERED } : session));
      await expect(service.enroll(1, me)).rejects.toBeInstanceOf(ConflictException);
    });

    it('re-activates a cancelled enrollment', async () => {
      em.findOne.mockImplementation(async (entity) => (entity === Enrollment ? { id: 5, status: EnrollmentStatus.CANCELLED } : session));
      const e = await service.enroll(1, me);
      expect(e).toMatchObject({ id: 5, status: EnrollmentStatus.REGISTERED });
    });

    it('rejects past and cancelled sessions', async () => {
      session.startAt = new Date(Date.now() - DAY);
      await expect(service.enroll(1, me)).rejects.toBeInstanceOf(BadRequestException);
      session.startAt = new Date(Date.now() + DAY);
      session.status = SessionStatus.CANCELLED;
      await expect(service.enroll(1, me)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('employees cannot enroll others, managers can', async () => {
      await expect(service.enroll(1, me, 99)).rejects.toBeInstanceOf(ForbiddenException);
      em.findOne.mockImplementation(async (entity) => (entity === Enrollment ? null : entity.name === 'User' ? { id: 99 } : session));
      const e = await service.enroll(1, { id: 1, roles: [Role.SST_MANAGER] }, 99);
      expect(e.userId).toBe(99);
    });
  });

  describe('updateEnrollment', () => {
    it('passed sets completedAt and expiresAt = completedAt + validityMonths', async () => {
      const enrollment: any = { id: 1, userId: 10, sessionId: 1, status: EnrollmentStatus.REGISTERED, progress: 0, session: { training: { title: 'Feu', validityMonths: 12 } } };
      enrollmentRepo.findOne.mockResolvedValue(enrollment);
      const res = await service.updateEnrollment(1, { status: EnrollmentStatus.PASSED, score: 90 });
      expect(res.completedAt).toBeInstanceOf(Date);
      const expected = new Date(res.completedAt);
      expected.setUTCMonth(expected.getUTCMonth() + 12);
      expect(res.expiresAt).toEqual(expected);
      expect(res.progress).toBe(100);
      expect(notifications.notifyUsers).toHaveBeenCalledTimes(1);
    });

    it('passed without validity never expires; leaving passed clears dates', async () => {
      const enrollment: any = { id: 1, userId: 10, status: EnrollmentStatus.ATTENDED, session: { training: { validityMonths: null } } };
      enrollmentRepo.findOne.mockResolvedValue(enrollment);
      expect((await service.updateEnrollment(1, { status: EnrollmentStatus.PASSED })).expiresAt).toBeNull();
      const back = await service.updateEnrollment(1, { status: EnrollmentStatus.FAILED });
      expect(back.completedAt).toBeNull();
    });
  });

  describe('myEnrollments', () => {
    it('adds isExpired / expiresSoon', async () => {
      const now = Date.now();
      const rows = [
        { id: 1, expiresAt: new Date(now - DAY), session: {} },
        { id: 2, expiresAt: new Date(now + 10 * DAY), session: {} },
        { id: 3, expiresAt: new Date(now + 90 * DAY), session: {} },
        { id: 4, expiresAt: null, session: {} },
      ];
      enrollmentRepo.createQueryBuilder.mockReturnValue(qb(rows));
      const res = await service.myEnrollments(10, {});
      expect(res.data.map((e) => [e.isExpired, e.expiresSoon])).toEqual([
        [true, false],
        [false, true],
        [false, false],
        [false, false],
      ]);
      expect(res).toMatchObject({ total: 4, page: 1, limit: 50 });
    });
  });

  describe('skills report & auto-plan', () => {
    const setup = () => {
      const now = Date.now();
      userRepo.find.mockResolvedValue([
        { id: 1, firstName: 'A', lastName: 'A', department: 'Prod', roles: [Role.EMPLOYEE] },
        { id: 2, firstName: 'B', lastName: 'B', department: 'Prod', roles: [Role.EMPLOYEE] },
        { id: 3, firstName: 'C', lastName: 'C', department: 'Prod', roles: [Role.EMPLOYEE] },
        { id: 4, firstName: 'P', lastName: 'P', department: 'Prod', roles: [Role.PENDING] },
      ]);
      trainingRepo.find.mockResolvedValue([{ id: 7, title: 'Feu', mandatoryForRoles: ['employee'] }, { id: 8, title: 'Optional', mandatoryForRoles: [] }]);
      enrollmentRepo.createQueryBuilder.mockReturnValue(
        qb([
          { userId: 1, completedAt: new Date(now - 10 * DAY), expiresAt: new Date(now + 300 * DAY), session: { trainingId: 7 } },
          { userId: 2, completedAt: new Date(now - 340 * DAY), expiresAt: new Date(now + 10 * DAY), session: { trainingId: 7 } },
          // user 3 only has an expired one
          { userId: 3, completedAt: new Date(now - 400 * DAY), expiresAt: new Date(now - 5 * DAY), session: { trainingId: 7 } },
        ]),
      );
      sessionRepo.find.mockResolvedValue([{ id: 55, trainingId: 7, startAt: new Date(now + 3 * DAY) }]);
    };

    it('classifies acquired / expiring / missing and filters by department', async () => {
      setup();
      const report = await service.skillsReport('Prod');
      expect(userRepo.find.mock.calls[0][0].where).toMatchObject({ department: 'Prod' });
      const by = (id: number) => report.users.find((u) => u.userId === id);
      expect(by(1).acquired).toHaveLength(1);
      expect(by(2).expiring).toHaveLength(1);
      expect(by(3).missing[0]).toMatchObject({ trainingId: 7, expired: true });
      expect(by(4)).toBeUndefined();
      expect(report.summary).toMatchObject({ users: 3, compliantUsers: 2 });
    });

    it('auto-plan lists lacking users with next session and notifies them', async () => {
      setup();
      const res = await service.autoPlan({});
      expect(res).toMatchObject({ total: 1, notified: 1, dryRun: false });
      expect(res.users[0].missing[0].nextSession).toMatchObject({ id: 55 });
      expect(notifications.notifyUsersOnce).toHaveBeenCalledWith([3], expect.objectContaining({ type: 'training', data: expect.objectContaining({ key: 'autoplan:7' }) }));
    });

    it('auto-plan dryRun does not notify', async () => {
      setup();
      const res = await service.autoPlan({ dryRun: true });
      expect(res.total).toBe(1);
      expect(notifications.notifyUsersOnce).not.toHaveBeenCalled();
    });
  });

  describe('cron jobs', () => {
    it('session reminders notify enrolled users with a per-session/day key', async () => {
      sessionRepo.createQueryBuilder.mockReturnValue(qb([{ id: 4, trainingId: 3, startAt: new Date(Date.now() + 7 * DAY), training: { title: 'Feu' } }]));
      enrollmentRepo.find.mockResolvedValue([{ userId: 1 }, { userId: 2 }]);
      notifications.notifyUsersOnce.mockResolvedValue([1, 2]);
      expect(await service.notifySessionReminders(new Date(), 7)).toBe(2);
      expect(notifications.notifyUsersOnce).toHaveBeenCalledWith([1, 2], expect.objectContaining({ data: expect.objectContaining({ key: 'session-reminder:4:7' }) }));
    });

    it('expiring certifications notify the user and managers', async () => {
      const exp = new Date(Date.now() + 5 * DAY);
      enrollmentRepo.createQueryBuilder.mockReturnValue(
        qb([{ id: 9, userId: 1, expiresAt: exp, session: { trainingId: 3, training: { title: 'Feu' } }, user: { firstName: 'A', lastName: 'B' } }]),
      );
      expect(await service.notifyExpiringCertifications(new Date())).toBe(1);
      expect(notifications.notifyUsersOnce).toHaveBeenCalledWith([1], expect.objectContaining({ data: expect.objectContaining({ key: 'cert:9:7' }) }), expect.any(Number));
      expect(notifications.notifyRolesOnce).toHaveBeenCalledWith(expect.arrayContaining(['admin']), expect.objectContaining({ data: expect.objectContaining({ key: 'cert:9:7' }) }), expect.any(Number));
    });

    it('runDailyChecks never throws', async () => {
      sessionRepo.createQueryBuilder.mockImplementation(() => {
        throw new Error('boom');
      });
      await expect(service.runDailyChecks()).resolves.toEqual({ reminders: 0, certifications: 0 });
    });
  });
});
