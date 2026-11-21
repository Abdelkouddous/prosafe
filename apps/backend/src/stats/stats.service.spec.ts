import { StatsService, percentage } from './stats.service';

const rawQb = (raw: any) => {
  const q: any = {};
  for (const m of ['select', 'addSelect', 'where', 'andWhere', 'groupBy', 'orderBy', 'addOrderBy', 'setParameters']) q[m] = jest.fn().mockReturnValue(q);
  q.getRawOne = jest.fn().mockResolvedValue(Array.isArray(raw) ? raw[0] : raw);
  q.getRawMany = jest.fn().mockResolvedValue(Array.isArray(raw) ? raw : [raw]);
  q.getCount = jest.fn().mockResolvedValue(0);
  return q;
};

describe('StatsService', () => {
  let incidentRepo: any, auditRepo: any, itemRepo: any, trainings: any, corrective: any, service: StatsService;

  beforeEach(() => {
    incidentRepo = { createQueryBuilder: jest.fn() };
    itemRepo = { createQueryBuilder: jest.fn() };
    auditRepo = { createQueryBuilder: jest.fn().mockReturnValue(rawQb({ avg: '82.34' })) };
    trainings = { computeSkills: jest.fn() };
    corrective = { countOverdue: jest.fn().mockResolvedValue(4) };
    service = new StatsService(incidentRepo, {} as any, itemRepo, {} as any, {} as any, trainings, corrective, auditRepo);
  });

  it('percentage rounds to 1 decimal and is null on an empty population', () => {
    expect(percentage(2, 3)).toBe(66.7);
    expect(percentage(0, 5)).toBe(0);
    expect(percentage(0, 0)).toBeNull();
  });

  it('kpis: resolution hours, equipment and training compliance, overdue actions', async () => {
    const monthQb = rawQb([{ key: '2026-01', count: '3' }, { key: '2026-02', count: '5' }]);
    const resQb = rawQb({ hours: '26.04' });
    incidentRepo.createQueryBuilder.mockReturnValueOnce(monthQb).mockReturnValueOnce(resQb);
    itemRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '8', ok: '6' }));
    trainings.computeSkills.mockResolvedValue([{ missing: [] }, { missing: [{}] }, { missing: [] }, { missing: [] }]);

    const k = await service.kpis({}, new Date('2026-03-01T00:00:00Z'));
    expect(k).toEqual({
      incidentsPerMonth: [{ month: '2026-01', count: 3 }, { month: '2026-02', count: 5 }],
      meanResolutionHours: 26,
      equipmentComplianceRate: 75,
      trainingComplianceRate: 75,
      correctiveActionsOverdue: 4,
      auditComplianceRate: 82.3,
    });
  });

  it('kpis: null rates when there is no data', async () => {
    incidentRepo.createQueryBuilder.mockReturnValueOnce(rawQb([])).mockReturnValueOnce(rawQb({ hours: null }));
    itemRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '0', ok: '0' }));
    trainings.computeSkills.mockResolvedValue([]);
    auditRepo.createQueryBuilder.mockReturnValue(rawQb({ avg: null }));
    const k = await service.kpis({});
    expect(k).toMatchObject({ auditComplianceRate: null, incidentsPerMonth: [], meanResolutionHours: null, equipmentComplianceRate: null, trainingComplianceRate: null });
  });

  it('incidentsBy maps zone/department nulls to N/A in SQL and casts counts', async () => {
    const qb = rawQb([{ key: 'N/A', count: '2' }]);
    incidentRepo.createQueryBuilder.mockReturnValue(qb);
    await expect(service.incidentsBy('zone', {})).resolves.toEqual([{ key: 'N/A', count: 2 }]);
    expect(qb.select.mock.calls[0][0]).toContain("'N/A'");
  });

  it('forecast: 12 months of history, zero-filled, then both methods per future month', async () => {
    incidentRepo.createQueryBuilder.mockReturnValue(rawQb([{ key: '2026-01', count: '6' }, { key: '2026-02', count: '9' }]));
    const f = await service.forecast(2, new Date('2026-03-10T00:00:00Z'));
    expect(f.history).toHaveLength(12);
    expect(f.history[0].month).toBe('2025-03');
    expect(f.history[11]).toEqual({ month: '2026-02', count: 9 });
    expect(f.history[5].count).toBe(0);
    expect(f.forecast.map((x) => `${x.month}:${x.method}`)).toEqual([
      '2026-03:linear_regression',
      '2026-04:linear_regression',
      '2026-03:moving_average',
      '2026-04:moving_average',
    ]);
  });
});
