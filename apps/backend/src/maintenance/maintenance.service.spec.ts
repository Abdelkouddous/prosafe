import { ConflictException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { Maintenance } from './entities/maintenance.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { InventoryCondition } from '../inventory/enums/inventory-condition.enum';
import { MaintenanceResult, MaintenanceStatus, MaintenanceType } from './enums/maintenance.enums';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let repo: any, itemRepo: any, notifications: any, manager: any, dataSource: any;
  let maintenance: any, item: any;

  const qb = (rows: any[]) => {
    const b: any = {};
    ['leftJoin', 'leftJoinAndSelect', 'addSelect', 'where', 'andWhere', 'orderBy'].forEach((m) => (b[m] = jest.fn(() => b)));
    b.getMany = jest.fn().mockResolvedValue(rows);
    b.getOne = jest.fn().mockResolvedValue(rows[0] ?? null);
    return b;
  };

  beforeEach(() => {
    maintenance = { id: 1, itemId: 9, type: MaintenanceType.INSPECTION, status: MaintenanceStatus.PLANNED, scheduledAt: new Date('2026-01-01') };
    item = { id: 9, name: 'Extincteur', condition: InventoryCondition.FUNCTIONAL, lastInspectionAt: null, nextInspectionAt: null };
    manager = {
      findOne: jest.fn(async (entity) => (entity === Maintenance ? maintenance : item)),
      save: jest.fn(async (_e, x) => x),
      create: jest.fn((_e, x) => x),
      createQueryBuilder: jest.fn(() => qb([])),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };
    repo = { createQueryBuilder: jest.fn(() => qb([{ ...maintenance, status: MaintenanceStatus.DONE }])), save: jest.fn(async (x) => x) };
    itemRepo = {};
    notifications = { notifyRolesOnce: jest.fn().mockResolvedValue([1]) };
    service = new MaintenanceService(repo, itemRepo, dataSource, notifications);
  });

  it('complete updates maintenance and item (ok -> functional, dates)', async () => {
    item.condition = InventoryCondition.NON_FUNCTIONAL;
    await service.complete(1, { result: MaintenanceResult.OK, notes: 'fine', doneAt: '2026-02-01T10:00:00Z' }, 5);
    expect(maintenance).toMatchObject({ status: MaintenanceStatus.DONE, result: 'ok', performedById: 5, notes: 'fine' });
    expect(item.lastInspectionAt).toEqual(new Date('2026-02-01T10:00:00Z'));
    expect(item.nextInspectionAt).toBeNull();
    expect(item.condition).toBe(InventoryCondition.FUNCTIONAL);
    expect(manager.save).toHaveBeenCalledWith(InventoryItem, item);
  });

  it('failed result sets non_functional', async () => {
    await service.complete(1, { result: MaintenanceResult.FAILED }, 5);
    expect(item.condition).toBe(InventoryCondition.NON_FUNCTIONAL);
  });

  it('issues result keeps the condition', async () => {
    await service.complete(1, { result: MaintenanceResult.ISSUES }, 5);
    expect(item.condition).toBe(InventoryCondition.FUNCTIONAL);
  });

  it('nextScheduledAt creates the next planned maintenance and sets nextInspectionAt', async () => {
    await service.complete(1, { result: MaintenanceResult.OK, doneAt: '2026-02-01T10:00:00Z', nextScheduledAt: '2026-08-01T10:00:00Z' }, 5);
    const created = manager.save.mock.calls.map((c: any[]) => c[1]).find((x: any) => x.status === MaintenanceStatus.PLANNED && x !== maintenance);
    expect(created).toMatchObject({ itemId: 9, type: 'inspection', scheduledAt: new Date('2026-08-01T10:00:00Z') });
    expect(item.nextInspectionAt).toEqual(new Date('2026-08-01T10:00:00Z'));
  });

  it('refuses to complete an already done maintenance', async () => {
    maintenance.status = MaintenanceStatus.DONE;
    await expect(service.complete(1, { result: MaintenanceResult.OK }, 5)).rejects.toBeInstanceOf(ConflictException);
  });

  it('cron marks past-due planned as overdue and notifies managers', async () => {
    const late = { ...maintenance, item: { name: 'Extincteur' }, scheduledAt: new Date('2026-01-01') };
    repo.createQueryBuilder.mockReturnValue(qb([late]));
    const n = await service.markOverdue(new Date('2026-03-01'));
    expect(n).toBe(1);
    expect(late.status).toBe(MaintenanceStatus.OVERDUE);
    expect(repo.save).toHaveBeenCalledWith(late);
    expect(notifications.notifyRolesOnce).toHaveBeenCalledWith(
      expect.arrayContaining(['admin', 'sst_manager']),
      expect.objectContaining({ data: expect.objectContaining({ key: 'maintenance-overdue:1' }) }),
    );
  });

  it('cron notifies maintenance due within 7 days', async () => {
    const due = { ...maintenance, item: { name: 'Extincteur' }, scheduledAt: new Date('2026-03-03') };
    repo.createQueryBuilder.mockReturnValue(qb([due]));
    expect(await service.notifyDueSoon(new Date('2026-03-01'))).toBe(1);
    expect(notifications.notifyRolesOnce).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ key: 'maintenance-due:1' }) }));
  });

  it('runDailyChecks never throws', async () => {
    repo.createQueryBuilder.mockImplementation(() => {
      throw new Error('db down');
    });
    await expect(service.runDailyChecks()).resolves.toEqual({ overdue: 0, dueSoon: 0 });
  });
});
