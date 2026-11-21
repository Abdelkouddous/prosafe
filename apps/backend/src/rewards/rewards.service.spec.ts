import { RewardsService, badgeFor, nextBadgeAt } from './rewards.service';

describe('badges', () => {
  it.each([
    [0, null, 20],
    [19, null, 20],
    [20, 'bronze', 50],
    [49, 'bronze', 50],
    [50, 'silver', 100],
    [100, 'gold', 200],
    [199, 'gold', 200],
    [200, 'platinum', null],
    [500, 'platinum', null],
  ])('%i points -> %s (next at %s)', (points, badge, next) => {
    expect(badgeFor(points as number)).toBe(badge);
    expect(nextBadgeAt(points as number)).toBe(next);
  });
});

describe('RewardsService', () => {
  let service: RewardsService;
  let repo: any;
  const qb = (raw: any) => {
    const q: any = {};
    for (const m of ['select', 'where', 'innerJoin', 'addSelect', 'groupBy', 'addGroupBy', 'having', 'orderBy', 'addOrderBy', 'limit', 'andWhere']) q[m] = jest.fn().mockReturnValue(q);
    q.getRawOne = jest.fn().mockResolvedValue(raw);
    q.getRawMany = jest.fn().mockResolvedValue(raw);
    return q;
  };

  beforeEach(() => {
    repo = { findOne: jest.fn(), save: jest.fn(async (x) => x), createQueryBuilder: jest.fn(), query: jest.fn() };
    service = new RewardsService(repo, {} as any);
  });

  it('revokeForIncident zeroes the row, keeps it, and returns the removed points', async () => {
    repo.findOne.mockResolvedValue({ id: 1, incidentId: 'INC-1', points: 15, reason: 'incident_report' });
    await expect(service.revokeForIncident('INC-1')).resolves.toBe(15);
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ points: 0, reason: 'incident_rejected' }));
  });

  it('revokeForIncident is idempotent / no-op without a reward', async () => {
    repo.findOne.mockResolvedValue({ points: 0 });
    await expect(service.revokeForIncident('INC-1')).resolves.toBe(0);
    repo.findOne.mockResolvedValue(null);
    await expect(service.revokeForIncident('INC-2')).resolves.toBe(0);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('summary: rank, badge and nextBadgeAt', async () => {
    repo.createQueryBuilder.mockReturnValue(qb({ sum: '55' }));
    repo.query.mockResolvedValue([{ better: 2 }]);
    await expect(service.getSummary(1)).resolves.toEqual({ totalPoints: 55, rank: 3, badge: 'silver', nextBadgeAt: 100 });
  });

  it('summary: no rank without points', async () => {
    repo.createQueryBuilder.mockReturnValue(qb({ sum: '0' }));
    await expect(service.getSummary(1)).resolves.toEqual({ totalPoints: 0, rank: null, badge: null, nextBadgeAt: 20 });
    expect(repo.query).not.toHaveBeenCalled();
  });

  it('leaderboard ranks rows and filters by period', async () => {
    const q = qb([
      { userId: '2', firstName: 'A', lastName: 'B', points: '120' },
      { userId: '1', firstName: 'C', lastName: 'D', points: '25' },
    ]);
    repo.createQueryBuilder.mockReturnValue(q);
    const res = await service.getLeaderboard('month', 10, new Date('2026-03-15T10:00:00Z'));
    expect(res).toEqual([
      { rank: 1, userId: 2, firstName: 'A', lastName: 'B', points: 120, badge: 'gold' },
      { rank: 2, userId: 1, firstName: 'C', lastName: 'D', points: 25, badge: 'bronze' },
    ]);
    expect(q.andWhere).toHaveBeenCalledWith('r.created_at >= :since', { since: new Date('2026-03-01T00:00:00Z') });
  });
});
