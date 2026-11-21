import { NotFoundException } from '@nestjs/common';
import { Role } from '../users/enums/role.enum';
import { RisksService } from './risks.service';
import { LmraDecision, RiskStatus } from './enums/risk.enums';

describe('RisksService', () => {
  let service: RisksService;
  let repo: any, planRepo: any, lmraRepo: any, caRepo: any, notifications: any, alerts: any, corrective: any;
  const manager = { id: 1, roles: [Role.SST_MANAGER] };
  const employee = { id: 9, roles: [Role.EMPLOYEE] };

  beforeEach(() => {
    let id = 10;
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: x.id ?? id++, ...x })),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    planRepo = {};
    lmraRepo = { create: jest.fn((x) => x), save: jest.fn(async (x) => ({ id: 5, ...x })) };
    caRepo = { delete: jest.fn() };
    notifications = { notifyRoles: jest.fn() };
    alerts = { create: jest.fn().mockResolvedValue({ id: 1 }) };
    corrective = { findBySource: jest.fn() };
    service = new RisksService(repo, planRepo, lmraRepo, caRepo, notifications, alerts, corrective);
  });

  const dto: any = { title: 'Chute', hazardCategory: 'chute', gravity: 4, probability: 4 };

  it('employee creates a proposed risk and managers are notified', async () => {
    const r = await service.create(dto, employee);
    expect(r).toMatchObject({ status: RiskStatus.PROPOSED, score: 16, level: 'critical', validatedById: null, proposedById: 9 });
    expect(notifications.notifyRoles).toHaveBeenCalledWith([Role.ADMIN, Role.SST_MANAGER], expect.objectContaining({ data: expect.objectContaining({ riskId: r.id }) }));
    expect(alerts.create).not.toHaveBeenCalled(); // only validated critical risks raise an alert
  });

  it('manager creates a validated risk; critical raises a risk alert + high priority notification', async () => {
    const r = await service.create(dto, manager);
    expect(r.status).toBe(RiskStatus.VALIDATED);
    expect(alerts.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'risk', severity: 'critical' }));
    expect(notifications.notifyRoles).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ priority: 'high' }));
  });

  it('non critical validated risk raises nothing', async () => {
    await service.create({ ...dto, gravity: 2, probability: 2 }, manager);
    expect(alerts.create).not.toHaveBeenCalled();
  });

  it('validating a proposed critical risk raises the alert once; re-saving does not repeat it', async () => {
    const proposed = { id: 3, status: RiskStatus.PROPOSED, level: 'critical', score: 16, gravity: 4, probability: 4, title: 'x', zone: null };
    repo.findOne.mockResolvedValue({ ...proposed });
    await service.update(3, { status: RiskStatus.VALIDATED }, manager);
    expect(alerts.create).toHaveBeenCalledTimes(1);
    repo.findOne.mockResolvedValue({ ...proposed, status: RiskStatus.VALIDATED });
    await service.update(3, { title: 'y' }, manager);
    expect(alerts.create).toHaveBeenCalledTimes(1);
  });

  it('evaluate recomputes score and level', async () => {
    repo.findOne.mockResolvedValue({ id: 3, status: RiskStatus.PROPOSED, gravity: 1, probability: 1, score: 1, level: 'low' });
    const r = await service.evaluate(3, { gravity: 3, probability: 4 });
    expect(r).toMatchObject({ score: 12, level: 'high' });
  });

  it('employees cannot read other people proposed risks (404)', async () => {
    repo.findOne.mockResolvedValue({ id: 3, status: RiskStatus.PROPOSED, proposedById: 2 });
    await expect(service.findOne(3, employee)).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('LMRA', () => {
    const hazards = [
      { label: 'Sol glissant', present: true, controlled: false },
      { label: 'Échafaudage', present: true, controlled: true },
      { label: 'Gaz', present: false, controlled: false },
      { label: 'Bruit', present: true, controlled: false },
    ];

    it('creates a proposed risk per present + uncontrolled hazard (default 3x3) and stores the assessment', async () => {
      const res = await service.createLmra({ task: 'Maintenance', location: 'Atelier', hazards, decision: LmraDecision.GO } as any, employee);
      expect(repo.save).toHaveBeenCalledTimes(2);
      expect(repo.save.mock.calls[0][0]).toMatchObject({ title: 'Sol glissant', status: RiskStatus.PROPOSED, gravity: 3, probability: 3, score: 9, zone: 'Atelier' });
      expect(res.riskIds).toHaveLength(2);
      expect(notifications.notifyRoles).toHaveBeenCalledTimes(1); // proposed risks only, no STOP
    });

    it('reuses an identical open risk instead of duplicating it', async () => {
      repo.findOne.mockResolvedValue({ id: 77 });
      const res = await service.createLmra({ task: 'T', hazards: [hazards[0]], decision: LmraDecision.GO } as any, employee);
      expect(repo.save).not.toHaveBeenCalled();
      expect(res.riskIds).toEqual([77]);
    });

    it('decision stop notifies managers with high priority', async () => {
      await service.createLmra({ task: 'Soudure', hazards: [], decision: LmraDecision.STOP } as any, employee);
      expect(notifications.notifyRoles).toHaveBeenCalledWith(
        [Role.ADMIN, Role.SST_MANAGER],
        expect.objectContaining({ priority: 'high', title: expect.stringContaining('STOP') }),
      );
    });
  });

  it('matrix counts validated risks by default', async () => {
    const qb: any = {};
    for (const m of ['select', 'orderBy', 'andWhere']) qb[m] = jest.fn().mockReturnValue(qb);
    qb.getMany = jest.fn().mockResolvedValue([{ id: 1, gravity: 2, probability: 3 }, { id: 2, gravity: 2, probability: 3 }]);
    repo.createQueryBuilder = jest.fn().mockReturnValue(qb);
    const m = await service.matrix({}, manager);
    expect(qb.andWhere).toHaveBeenCalledWith('r.status = :status', { status: RiskStatus.VALIDATED });
    expect(m.total).toBe(2);
    expect(m.cells.find((c) => c.gravity === 2 && c.probability === 3)).toMatchObject({ count: 2, riskIds: [1, 2] });
  });
});
