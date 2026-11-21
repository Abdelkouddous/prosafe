import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '../users/enums/role.enum';
import { EMERGENCY_ROLES, EmergencyService } from './emergency.service';

describe('EmergencyService', () => {
  let service: EmergencyService;
  let scenarioRepo: any, eventRepo: any, drillRepo: any, notifications: any, alerts: any;
  const manager = { id: 1, roles: [Role.SST_MANAGER] };

  beforeEach(() => {
    scenarioRepo = { findOne: jest.fn().mockResolvedValue({ id: 2, title: 'Incendie', isActive: true }) };
    eventRepo = { create: jest.fn((x) => x), save: jest.fn(async (x) => ({ id: 8, ...x })), findOne: jest.fn() };
    drillRepo = {};
    notifications = { notifyRoles: jest.fn() };
    alerts = { create: jest.fn().mockResolvedValue({ id: 33 }) };
    service = new EmergencyService(scenarioRepo, eventRepo, drillRepo, notifications, alerts);
  });

  it('trigger stores the event, raises an emergency alert and notifies every role with high priority', async () => {
    const e = await service.trigger({ scenarioId: 2, message: 'Feu au hangar', zone: 'Hangar' }, manager);
    expect(e).toMatchObject({ id: 8, active: true, triggeredById: 1, alertId: 33 });
    expect(alerts.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'emergency', severity: 'critical' }));
    expect(EMERGENCY_ROLES).toEqual([Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE]);
    expect(notifications.notifyRoles).toHaveBeenCalledWith(
      EMERGENCY_ROLES,
      expect.objectContaining({ type: 'emergency', priority: 'high', data: expect.objectContaining({ eventId: 8, scenarioId: 2 }) }),
    );
  });

  it('still notifies when the alert creation fails', async () => {
    alerts.create.mockRejectedValue(new Error('db'));
    await service.trigger({ message: 'Alerte' }, manager);
    expect(notifications.notifyRoles).toHaveBeenCalledTimes(1);
  });

  it('rejects unknown or inactive scenarios', async () => {
    scenarioRepo.findOne.mockResolvedValue(null);
    await expect(service.trigger({ scenarioId: 9, message: 'x' }, manager)).rejects.toBeInstanceOf(NotFoundException);
    scenarioRepo.findOne.mockResolvedValue({ id: 2, isActive: false });
    await expect(service.trigger({ scenarioId: 2, message: 'x' }, manager)).rejects.toBeInstanceOf(BadRequestException);
    expect(notifications.notifyRoles).not.toHaveBeenCalled();
  });

  it('close marks the event inactive and notifies the end of alert', async () => {
    eventRepo.findOne.mockResolvedValue({ id: 8, active: true, message: 'Feu', zone: null });
    const e = await service.closeEvent(8, manager);
    expect(e.active).toBe(false);
    expect(e.closedAt).toBeInstanceOf(Date);
    expect(notifications.notifyRoles).toHaveBeenCalledWith(EMERGENCY_ROLES, expect.objectContaining({ data: { eventId: 8, closed: true } }));
  });

  it('closing an already closed event is a 400', async () => {
    eventRepo.findOne.mockResolvedValue({ id: 8, active: false });
    await expect(service.closeEvent(8, manager)).rejects.toBeInstanceOf(BadRequestException);
  });
});
