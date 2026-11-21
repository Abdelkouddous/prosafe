import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentStatus } from './enums/incident-status.enum';
import { IncidentHistory } from './entities/incident-history.entity';

/** Chainable query builder mock that records where clauses. */
const makeQb = (result: any = null, list: any[] = []) => {
  const qb: any = { wheres: [] as string[], params: {} as Record<string, any> };
  for (const m of ['leftJoin', 'addSelect', 'orderBy', 'addOrderBy', 'skip', 'take']) qb[m] = jest.fn().mockReturnValue(qb);
  const where = (sql: string, p?: any) => {
    qb.wheres.push(sql);
    Object.assign(qb.params, p ?? {});
    return qb;
  };
  qb.where = jest.fn(where);
  qb.andWhere = jest.fn(where);
  qb.getOne = jest.fn().mockResolvedValue(result);
  qb.getMany = jest.fn().mockResolvedValue(list);
  qb.getManyAndCount = jest.fn().mockResolvedValue([list, list.length]);
  return qb;
};

describe('IncidentsService', () => {
  let service: IncidentsService;
  let repo: any;
  let em: any;
  let notifications: { notifyRoles: jest.Mock; notifyUsers: jest.Mock };
  let files: { saveUploaded: jest.Mock; discard: jest.Mock };
  let rewards: { awardForIncident: jest.Mock; revokeForIncident: jest.Mock };
  let corrective: { findBySource: jest.Mock };
  let alerts: { create: jest.Mock };

  const incident = (status: IncidentStatus, extra = {}) => ({ id: 1, incidentId: 'INC-1', reportedBy: 5, status, ...extra });

  beforeEach(() => {
    em = {
      create: jest.fn((_cls, data) => ({ ...data })),
      save: jest.fn().mockImplementation(async (i) => (i.incidentRefId === undefined && i.id === undefined ? { ...i, id: 42 } : i)),
    };
    repo = {
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { transaction: jest.fn(async (cb) => cb(em)) },
    };
    notifications = { notifyRoles: jest.fn(), notifyUsers: jest.fn() };
    files = { saveUploaded: jest.fn(), discard: jest.fn() };
    rewards = { awardForIncident: jest.fn().mockResolvedValue({ pointsAwarded: 10, totalPoints: 10 }), revokeForIncident: jest.fn().mockResolvedValue(15) };
    corrective = { findBySource: jest.fn().mockResolvedValue([{ id: 1, title: 'Fix' }]) };
    alerts = { create: jest.fn().mockResolvedValue({}) };
    service = new IncidentsService(repo, rewards as any, files as any, notifications as any, corrective as any, alerts as any);
  });

  describe('updateStatus', () => {
    const historyRows = () => em.create.mock.calls.filter(([cls]) => cls === IncidentHistory).map(([, d]) => d);

    it('INVESTIGATING does not set resolvedAt / resolvedBy', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.OPEN));
      const res = await service.updateStatus('INC-1', { status: IncidentStatus.INVESTIGATING }, 9);
      expect(res.status).toBe(IncidentStatus.INVESTIGATING);
      expect(res.resolvedAt ?? null).toBeNull();
      expect(res.resolvedBy ?? null).toBeNull();
    });

    it('RESOLVED sets resolvedAt / resolvedBy', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.INVESTIGATING));
      const res = await service.updateStatus('INC-1', { status: IncidentStatus.RESOLVED }, 9);
      expect(res.resolvedAt).toBeInstanceOf(Date);
      expect(res.resolvedBy).toBe(9);
    });

    it('re-opening to INVESTIGATING clears the resolution fields', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.RESOLVED, { resolvedAt: new Date(), resolvedBy: 4 }));
      const res = await service.updateStatus('INC-1', { status: IncidentStatus.INVESTIGATING }, 9);
      expect(res.resolvedAt).toBeNull();
      expect(res.resolvedBy).toBeNull();
    });

    it('writes a history row (from, to, comment, changedBy) on every change', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.OPEN));
      await service.updateStatus('INC-1', { status: IncidentStatus.INVESTIGATING, comment: 'on it' }, 9);
      expect(historyRows()).toEqual([
        { incidentRefId: 1, fromStatus: IncidentStatus.OPEN, toStatus: IncidentStatus.INVESTIGATING, comment: 'on it', changedById: 9 },
      ]);
    });

    it('notifies the reporter', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.OPEN));
      await service.updateStatus('INC-1', { status: IncidentStatus.RESOLVED }, 9);
      expect(notifications.notifyUsers).toHaveBeenCalledWith([5], expect.objectContaining({ type: 'incident' }));
    });

    it('rejects invalid transitions without writing history', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.CLOSED));
      await expect(service.updateStatus('INC-1', { status: IncidentStatus.OPEN }, 9)).rejects.toBeInstanceOf(BadRequestException);
      expect(em.create).not.toHaveBeenCalled();
    });

    it('accepts a numeric id', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.OPEN));
      await service.updateStatus('12', { status: IncidentStatus.RESOLVED }, 9);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 12 } });
    });

    it('404 when unknown', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateStatus('INC-X', { status: IncidentStatus.RESOLVED }, 9)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('evaluate (A4)', () => {
    it('computes riskScore = gravity * probability and stores the evaluator', async () => {
      const inc: any = incident(IncidentStatus.OPEN);
      repo.findOne.mockResolvedValue(inc);
      repo.save = jest.fn(async (i) => i);
      repo.createQueryBuilder.mockReturnValue(makeQb({ ...inc, evaluatedAt: new Date(), gravity: 4, probability: 3, riskScore: 12 }));
      const res: any = await service.evaluate('INC-1', { gravity: 4, probability: 3, rootCause: 'worn cable', evaluatedSeverity: 'high' as any }, 9);
      const saved = repo.save.mock.calls[0][0];
      expect(saved).toMatchObject({ gravity: 4, probability: 3, riskScore: 12, rootCause: 'worn cable', evaluatedSeverity: 'high', evaluatedById: 9 });
      expect(saved.evaluatedAt).toBeInstanceOf(Date);
      expect(res.evaluation.riskScore).toBe(12);
      expect(res.correctiveActions).toHaveLength(1);
    });

    it('404 for an unknown incident', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.evaluate('99', { gravity: 1, probability: 1 }, 9)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('rejected status (A1)', () => {
    it('revokes the reward points when closing as rejected', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.OPEN));
      await service.updateStatus('INC-1', { status: IncidentStatus.CLOSED, rejected: true }, 9);
      expect(rewards.revokeForIncident).toHaveBeenCalledWith('INC-1');
      expect(notifications.notifyUsers.mock.calls[0][1].data).toMatchObject({ rejected: true, pointsRevoked: 15 });
    });

    it('does not revoke on a plain close', async () => {
      repo.findOne.mockResolvedValue(incident(IncidentStatus.OPEN));
      await service.updateStatus('INC-1', { status: IncidentStatus.CLOSED }, 9);
      expect(rewards.revokeForIncident).not.toHaveBeenCalled();
    });

    it('rejects `rejected` with a status other than closed', async () => {
      await expect(service.updateStatus('INC-1', { status: IncidentStatus.RESOLVED, rejected: true }, 9)).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('restricts employees to their own incidents and ignores reporterId', async () => {
      const qb = makeQb();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ reporterId: 99 }, { userId: 5, isManager: false });
      expect(qb.wheres).toContain('i.reportedBy = :me');
      expect(qb.params.me).toBe(5);
      expect(qb.wheres).not.toContain('i.reportedBy = :rid');
    });

    it('managers see everyone and may filter by reporterId', async () => {
      const qb = makeQb();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ reporterId: 99 }, { userId: 1, isManager: true });
      expect(qb.wheres).not.toContain('i.reportedBy = :me');
      expect(qb.params.rid).toBe(99);
    });

    it('applies filters and returns the paginated shape with media mapped', async () => {
      const row = { id: 1, incidentId: 'INC-1', geoLatitude: '36.5', media: [{ id: 3, kind: 'image', file: { id: 8, mimeType: 'image/png' } }] };
      const qb = makeQb(null, [row]);
      repo.createQueryBuilder.mockReturnValue(qb);
      const res = await service.findAll(
        { page: 2, limit: 5, status: IncidentStatus.OPEN, zone: 'A', department: 'IT', search: 'fire' },
        { userId: 1, isManager: true },
      );
      expect(qb.params).toMatchObject({ status: 'open', zone: 'A', department: 'IT', s: '%fire%' });
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(res).toMatchObject({ total: 1, page: 2, limit: 5 });
      expect(res.data[0].media).toEqual([{ id: 8, kind: 'image', mimeType: 'image/png' }]);
      expect(res.data[0].geoLatitude).toBe(36.5);
    });

    it('requires lat, lng and radiusKm together', async () => {
      repo.createQueryBuilder.mockReturnValue(makeQb());
      await expect(service.findAll({ lat: 1 }, { userId: 1, isManager: true })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('adds a distance filter when lat/lng/radiusKm are given', async () => {
      const qb = makeQb();
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ lat: 36, lng: 3, radiusKm: 10 }, { userId: 1, isManager: true });
      expect(qb.params).toMatchObject({ lat: 36, lng: 3, radius: 10 });
    });
  });

  describe('findOne', () => {
    it("hides other users' incidents from employees", async () => {
      repo.createQueryBuilder.mockReturnValue(makeQb(incident(IncidentStatus.OPEN)));
      await expect(service.findOne('INC-1', { userId: 6, isManager: false })).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.findOne('INC-1', { userId: 5, isManager: false })).resolves.toBeDefined();
      await expect(service.findOne('INC-1', { userId: 6, isManager: true })).resolves.toBeDefined();
    });

    it('looks up by numeric id or INC- code', async () => {
      const qb = makeQb(incident(IncidentStatus.OPEN));
      repo.createQueryBuilder.mockReturnValue(qb);
      await service.findOne('7');
      expect(qb.params.id).toBe(7);
      await service.findOne('INC-20260101-ABC123');
      expect(qb.params.code).toBe('INC-20260101-ABC123');
    });
  });

  describe('create', () => {
    const dto: any = { type: 'safety', severity: 'critical', description: 'd', latitude: 36, longitude: 3 };

    it('writes media + a null->open history row and notifies managers with high priority', async () => {
      files.saveUploaded.mockResolvedValue({ id: 8, mimeType: 'video/mp4' });
      repo.findOne.mockResolvedValue(null);
      const vid: any = { mimetype: 'video/mp4', filename: 'x' };
      const res = await service.create(dto, [vid], 5);
      expect(res.id).toBe(42);
      const created = em.create.mock.calls.map(([cls, d]) => [cls.name, d]);
      expect(created).toEqual(
        expect.arrayContaining([
          ['IncidentMedia', expect.objectContaining({ fileId: 8, kind: 'video' })],
          ['IncidentHistory', expect.objectContaining({ fromStatus: null, toStatus: IncidentStatus.OPEN, changedById: 5 })],
        ]),
      );
      expect(notifications.notifyRoles).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ priority: 'high' }));
    });

    it('raises a critical_incident alert for critical incidents only', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.create(dto, [], 5);
      expect(alerts.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'critical_incident', severity: 'critical' }));
      alerts.create.mockClear();
      await service.create({ ...dto, severity: 'low' }, [], 5);
      expect(alerts.create).not.toHaveBeenCalled();
    });

    it('requires a location', async () => {
      await expect(service.create({ ...dto, latitude: undefined, longitude: undefined }, [], 5)).rejects.toBeInstanceOf(BadRequestException);
      expect(files.discard).toHaveBeenCalled();
    });

    it('rejects more than 5 files', async () => {
      const many: any[] = Array.from({ length: 6 }, () => ({ mimetype: 'image/png' }));
      await expect(service.create(dto, many, 5)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
