import { InventoryService } from './inventory.service';
import { InventoryStatus } from './enums/inventory-status.enum';
import { InventoryCondition } from './enums/inventory-condition.enum';

describe('InventoryService', () => {
  let service: InventoryService;
  let repo: any, notifications: any;

  beforeEach(() => {
    repo = {
      create: jest.fn((x) => ({ ...x })),
      save: jest.fn(async (x) => x),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    notifications = { notifyRoles: jest.fn(), notifyRolesOnce: jest.fn() };
    service = new InventoryService(repo, notifications);
  });

  it('create computes the stock status like update', async () => {
    const low = await service.create({ name: 'a', quantity: 2, min_stock_level: 5 } as any);
    expect(low.status).toBe(InventoryStatus.LOW_STOCK);
    const out = await service.create({ name: 'a', quantity: 0, min_stock_level: 5 } as any);
    expect(out.status).toBe(InventoryStatus.OUT_OF_STOCK);
    const ok = await service.create({ name: 'a', quantity: 10, min_stock_level: 5 } as any);
    expect(ok.status).toBe(InventoryStatus.ACTIVE);
  });

  it('update notifies managers when the item becomes low stock', async () => {
    repo.findOne.mockResolvedValue({ id: 1, name: 'Gants', quantity: 10, min_stock_level: 5, status: InventoryStatus.ACTIVE });
    const res = await service.update(1, { quantity: 3 });
    expect(res.status).toBe(InventoryStatus.LOW_STOCK);
    expect(notifications.notifyRoles).toHaveBeenCalledWith(
      expect.arrayContaining(['admin', 'sst_manager']),
      expect.objectContaining({ type: 'inventory' }),
    );
  });

  it('update does not re-notify when the status is unchanged', async () => {
    repo.findOne.mockResolvedValue({ id: 1, name: 'Gants', quantity: 3, min_stock_level: 5, status: InventoryStatus.LOW_STOCK });
    await service.update(1, { quantity: 2 });
    expect(notifications.notifyRoles).not.toHaveBeenCalled();
  });

  it('reportDefect sets non_functional and notifies managers', async () => {
    const item = { id: 1, name: 'Extincteur', condition: InventoryCondition.FUNCTIONAL };
    repo.findOne.mockResolvedValue(item);
    const res = await service.reportDefect(1, 'fuite', 7);
    expect(res.condition).toBe(InventoryCondition.NON_FUNCTIONAL);
    expect(notifications.notifyRoles).toHaveBeenCalledTimes(1);
  });

  it('cron: low/out-of-stock items notify managers with dedupe keys', async () => {
    repo.find.mockResolvedValue([
      { id: 1, name: 'A', quantity: 1, min_stock_level: 5, status: InventoryStatus.LOW_STOCK },
      { id: 2, name: 'B', quantity: 0, min_stock_level: 5, status: InventoryStatus.OUT_OF_STOCK },
    ]);
    expect(await service.notifyLowStock()).toBe(2);
    expect(notifications.notifyRolesOnce).toHaveBeenCalledTimes(2);
    expect(notifications.notifyRolesOnce.mock.calls[1][1].data.key).toBe('stock:2:out_of_stock');
  });

  it('cron: expiring items notify managers', async () => {
    const qb: any = { where: jest.fn(() => qb), andWhere: jest.fn(() => qb), getMany: jest.fn().mockResolvedValue([{ id: 3, name: 'Trousse', expiryDate: '2026-03-10' }]) };
    repo.createQueryBuilder = jest.fn(() => qb);
    expect(await service.notifyExpiring(new Date('2026-03-01'))).toBe(1);
    expect(notifications.notifyRolesOnce).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ key: 'expiry:3:2026-03-10' }) }));
  });
});
