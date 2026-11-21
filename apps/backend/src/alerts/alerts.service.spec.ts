import { AlertsService, isIncidentSpike } from './alerts.service';

describe('isIncidentSpike', () => {
  it('needs > 1.5x the previous weekly average AND at least 3 incidents', () => {
    expect(isIncidentSpike(4, 8)).toBe(true); // avg 2 -> 4 > 3
    expect(isIncidentSpike(3, 8)).toBe(false); // 3 > 3 is false
    expect(isIncidentSpike(2, 0)).toBe(false); // below minimum count
    expect(isIncidentSpike(3, 0)).toBe(true); // no history
    expect(isIncidentSpike(10, 40)).toBe(false); // avg 10
  });
});

describe('AlertsService.detectIncidentSpikes', () => {
  let service: AlertsService;
  let alertsRepo: any, incidentRepo: any, notifications: any;
  const qb = (o: any) => {
    const q: any = {};
    for (const m of ['select', 'addSelect', 'where', 'andWhere', 'setParameters', 'groupBy']) q[m] = jest.fn().mockReturnValue(q);
    return Object.assign(q, o);
  };

  beforeEach(() => {
    alertsRepo = { create: jest.fn((x) => x), save: jest.fn(async (x) => x), createQueryBuilder: jest.fn() };
    incidentRepo = { createQueryBuilder: jest.fn() };
    notifications = { notifyRolesOnce: jest.fn() };
    service = new AlertsService(alertsRepo, incidentRepo, notifications);
  });

  it('creates one alert + manager notification per spiking type', async () => {
    incidentRepo.createQueryBuilder.mockReturnValue(
      qb({ getRawMany: jest.fn().mockResolvedValue([
        { type: 'safety', recent: '5', previous: '4' },
        { type: 'security', recent: '2', previous: '0' },
        { type: 'environment', recent: '4', previous: '20' },
      ]) }),
    );
    alertsRepo.createQueryBuilder.mockReturnValue(qb({ getCount: jest.fn().mockResolvedValue(0) }));
    const n = await service.detectIncidentSpikes(new Date());
    expect(n).toBe(1);
    expect(alertsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ type: 'incident_spike', metadata: expect.objectContaining({ incidentType: 'safety', last7Days: 5 }) }));
    expect(notifications.notifyRolesOnce).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ key: 'incident_spike:safety' }) }), 168);
  });

  it('does not duplicate an alert raised in the last 7 days', async () => {
    incidentRepo.createQueryBuilder.mockReturnValue(qb({ getRawMany: jest.fn().mockResolvedValue([{ type: 'safety', recent: '5', previous: '4' }]) }));
    alertsRepo.createQueryBuilder.mockReturnValue(qb({ getCount: jest.fn().mockResolvedValue(1) }));
    await expect(service.detectIncidentSpikes(new Date())).resolves.toBe(0);
    expect(alertsRepo.save).not.toHaveBeenCalled();
  });
});
