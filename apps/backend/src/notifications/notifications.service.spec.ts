import { NotificationsService, PREFERENCE_DEFAULTS } from './notifications.service';
import { NotificationType } from './enums/notification-type.enum';
import { Role } from '../users/enums/role.enum';

const mockSend = jest.fn();
jest.mock('expo-server-sdk', () => {
  class Expo {
    static isExpoPushToken = (t: string) => typeof t === 'string' && t.startsWith('ExponentPushToken[');
    chunkPushNotifications = (m: any[]) => [m];
    sendPushNotificationsAsync = (...a: any[]) => mockSend(...a);
  }
  return { Expo };
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notifRepo: any, deviceRepo: any, prefRepo: any, userRepo: any, mailer: any;

  beforeEach(() => {
    mockSend.mockReset().mockResolvedValue([{ status: 'ok' }]);
    notifRepo = { create: jest.fn((x) => x), save: jest.fn(async (x) => x) };
    deviceRepo = { find: jest.fn().mockResolvedValue([]), delete: jest.fn() };
    prefRepo = { find: jest.fn().mockResolvedValue([]) };
    userRepo = { find: jest.fn().mockResolvedValue([]) };
    mailer = { sendMail: jest.fn().mockResolvedValue(undefined) };
    service = new NotificationsService(notifRepo, deviceRepo, prefRepo, userRepo, mailer);
  });

  const saved = () => (notifRepo.save.mock.calls[0]?.[0] ?? []).map((n: any) => n.userId);
  const payload = { type: NotificationType.INCIDENT, title: 't', body: 'b' };

  it('stores a row per recipient', async () => {
    await service.notifyUsers([1, 2, 2], payload);
    expect(saved()).toEqual([1, 2]);
  });

  it('skips users who disabled the type preference', async () => {
    prefRepo.find.mockResolvedValue([{ userId: 1, ...PREFERENCE_DEFAULTS, incidents: false }]);
    await service.notifyUsers([1, 2], payload);
    expect(saved()).toEqual([2]);
  });

  it('always delivers emergency notifications', async () => {
    prefRepo.find.mockResolvedValue([{ userId: 1, ...PREFERENCE_DEFAULTS, emergency: false, push: false }]);
    deviceRepo.find.mockResolvedValue([{ id: 1, userId: 1, token: 'ExponentPushToken[a]' }]);
    userRepo.find.mockResolvedValue([{ id: 1, email: 'a@b.c' }]);
    await service.notifyUsers([1], { ...payload, type: NotificationType.EMERGENCY });
    expect(saved()).toEqual([1]);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });

  it('sends Expo push to valid tokens only and honours push=false', async () => {
    prefRepo.find.mockResolvedValue([{ userId: 2, ...PREFERENCE_DEFAULTS, push: false }]);
    deviceRepo.find.mockResolvedValue([
      { id: 1, userId: 1, token: 'ExponentPushToken[ok]' },
      { id: 2, userId: 1, token: 'garbage' },
    ]);
    await service.notifyUsers([1, 2], payload);
    expect(deviceRepo.find.mock.calls[0][0].where.userId._value).toEqual([1]);
    const msgs = mockSend.mock.calls[0][0];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].to).toBe('ExponentPushToken[ok]');
  });

  it('deletes tokens reported as DeviceNotRegistered', async () => {
    deviceRepo.find.mockResolvedValue([{ id: 1, userId: 1, token: 'ExponentPushToken[dead]' }]);
    mockSend.mockResolvedValue([{ status: 'error', message: 'x', details: { error: 'DeviceNotRegistered' } }]);
    await service.notifyUsers([1], payload);
    expect(deviceRepo.delete).toHaveBeenCalled();
  });

  it('does not crash when Expo throws', async () => {
    deviceRepo.find.mockResolvedValue([{ id: 1, userId: 1, token: 'ExponentPushToken[a]' }]);
    mockSend.mockRejectedValue(new Error('network'));
    await expect(service.notifyUsers([1], payload)).resolves.toBeUndefined();
  });

  it('emails only for high priority and when email pref is on', async () => {
    userRepo.find.mockResolvedValue([{ id: 2, email: 'b@b.c' }]);
    await service.notifyUsers([1, 2], payload);
    expect(mailer.sendMail).not.toHaveBeenCalled();

    prefRepo.find.mockResolvedValue([{ userId: 1, ...PREFERENCE_DEFAULTS, email: false }]);
    await service.notifyUsers([1, 2], { ...payload, priority: 'high' });
    expect(userRepo.find.mock.calls.at(-1)[0].where.id._value).toEqual([2]);
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });

  it('survives mailer failures', async () => {
    mailer.sendMail.mockRejectedValue(new Error('smtp'));
    userRepo.find.mockResolvedValue([{ id: 1, email: 'a@b.c' }]);
    await expect(service.notifyUsers([1], { ...payload, priority: 'high' })).resolves.toBeUndefined();
  });

  it('notifyRoles targets active users holding one of the roles', async () => {
    userRepo.find.mockResolvedValueOnce([
      { id: 1, roles: [Role.ADMIN] },
      { id: 2, roles: [Role.EMPLOYEE] },
      { id: 3, roles: [Role.SST_MANAGER] },
    ]);
    await service.notifyRoles([Role.ADMIN, Role.SST_MANAGER], payload);
    expect(saved()).toEqual([1, 3]);
  });

  describe('notifyUsersOnce (dedupe)', () => {
    const once = { type: NotificationType.INVENTORY, title: 't', body: 'b', data: { key: 'stock:1:low_stock' } };
    const qb = (rows: any[]) => {
      const b: any = {};
      ['select', 'where', 'andWhere'].forEach((m) => (b[m] = jest.fn(() => b)));
      b.getRawMany = jest.fn().mockResolvedValue(rows);
      return b;
    };

    it('skips users already notified with the same key in the window', async () => {
      notifRepo.createQueryBuilder = jest.fn(() => qb([{ userId: 1 }]));
      const sent = await service.notifyUsersOnce([1, 2], once);
      expect(sent).toEqual([2]);
      expect(saved()).toEqual([2]);
    });

    it('sends nothing when everyone was already notified', async () => {
      notifRepo.createQueryBuilder = jest.fn(() => qb([{ userId: 1 }, { userId: 2 }]));
      expect(await service.notifyUsersOnce([1, 2], once)).toEqual([]);
      expect(notifRepo.save).not.toHaveBeenCalled();
    });

    it('notifyRolesOnce resolves managers then dedupes', async () => {
      userRepo.find.mockResolvedValue([{ id: 1, roles: [Role.ADMIN] }, { id: 2, roles: [Role.EMPLOYEE] }]);
      notifRepo.createQueryBuilder = jest.fn(() => qb([]));
      expect(await service.notifyRolesOnce([Role.ADMIN], once)).toEqual([1]);
    });

    it('never throws', async () => {
      notifRepo.createQueryBuilder = jest.fn(() => {
        throw new Error('db');
      });
      await expect(service.notifyUsersOnce([1], once)).resolves.toEqual([]);
    });
  });
});
