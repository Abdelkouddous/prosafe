import { BadRequestException } from '@nestjs/common';
import { AuditsService } from './audits.service';
import { summarizeResponses } from './audit-score';
import { AuditResult, AuditStatus } from './enums/audit.enums';

describe('summarizeResponses', () => {
  it('score = conform / (conform + non_conform), N/A excluded', () => {
    const s = summarizeResponses([AuditResult.CONFORM, AuditResult.CONFORM, AuditResult.NON_CONFORM, AuditResult.NOT_APPLICABLE], 6);
    expect(s).toEqual({ conform: 2, nonConform: 1, notApplicable: 1, unanswered: 2, score: 66.7 });
  });
  it('score is null when nothing is applicable', () => {
    expect(summarizeResponses([AuditResult.NOT_APPLICABLE], 1).score).toBeNull();
    expect(summarizeResponses([], 3).score).toBeNull();
  });
});

describe('AuditsService', () => {
  let service: AuditsService;
  let repo: any, templateRepo: any, responseRepo: any, caRepo: any, userRepo: any, fileRepo: any, corrective: any, notifications: any, alerts: any;
  let stored: any[];
  const template = { id: 1, standard: 'ISO 45001', items: [1, 2, 3].map((i) => ({ id: i, clause: `4.${i}`, question: `Question ${i} ?` })) };
  const actor = { id: 1 };

  beforeEach(() => {
    stored = [];
    let rid = 1;
    repo = { findOne: jest.fn().mockResolvedValue({ id: 5, status: AuditStatus.PLANNED, templateId: 1, score: null }), save: jest.fn(async (x) => x), find: jest.fn(), createQueryBuilder: jest.fn() };
    templateRepo = { findOne: jest.fn().mockResolvedValue(template) };
    responseRepo = {
      create: jest.fn((x) => x),
      find: jest.fn(async () => stored),
      save: jest.fn(async (x) => {
        if (!x.id) {
          x.id = rid++;
          stored.push(x);
        }
        return x;
      }),
    };
    caRepo = {};
    userRepo = { findOne: jest.fn().mockResolvedValue({ id: 3, isActive: true, roles: ['employee'] }) };
    fileRepo = { count: jest.fn().mockResolvedValue(0) };
    corrective = { create: jest.fn(async () => ({ id: 100 })), findBySource: jest.fn().mockResolvedValue([]) };
    notifications = { notifyUsersOnce: jest.fn(), notifyRolesOnce: jest.fn(), notifyRoles: jest.fn() };
    alerts = { create: jest.fn() };
    service = new AuditsService(repo, templateRepo, responseRepo, caRepo, userRepo, fileRepo, corrective, notifications, alerts);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 5 } as any);
  });

  const body = (extra = {}): any => ({
    responses: [
      { itemId: 1, result: AuditResult.CONFORM },
      { itemId: 2, result: AuditResult.NON_CONFORM, comment: 'Pas de procédure' },
      { itemId: 3, result: AuditResult.NON_CONFORM },
    ],
    ...extra,
  });

  it('computes the score and moves a planned audit to in_progress', async () => {
    await service.submitResponses(5, body(), actor);
    const audit = repo.save.mock.calls.at(-1)[0];
    expect(audit.score).toBe(33.3);
    expect(audit.status).toBe(AuditStatus.IN_PROGRESS);
    expect(corrective.create).not.toHaveBeenCalled();
  });

  it('createActions makes one corrective action (sourceType audit) per non-conform item, never twice', async () => {
    await service.submitResponses(5, body({ createActions: true, actionOwnerId: 3 }), actor);
    expect(corrective.create).toHaveBeenCalledTimes(2);
    expect(corrective.create.mock.calls[0][0]).toMatchObject({ sourceType: 'audit', sourceId: 5, ownerId: 3, description: 'Pas de procédure' });
    expect(corrective.create.mock.calls[0][0].title).toContain('4.2');
    await service.submitResponses(5, body({ createActions: true }), actor);
    expect(corrective.create).toHaveBeenCalledTimes(2);
  });

  it('rejects items that are not in the template', async () => {
    await expect(service.submitResponses(5, { responses: [{ itemId: 99, result: AuditResult.CONFORM }] } as any, actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects responses for a cancelled audit', async () => {
    repo.findOne.mockResolvedValue({ id: 5, status: AuditStatus.CANCELLED, templateId: 1 });
    await expect(service.submitResponses(5, body(), actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('reminders', () => {
    const now = new Date('2026-03-01T07:00:00Z');
    const at = (days: number, hours = 0) => new Date(now.getTime() + days * 86400000 - hours * 3600000);

    it('notifies auditor and managers 7 days and 1 day before, nobody else', async () => {
      repo.find.mockResolvedValue([
        { id: 1, title: 'A7', scheduledAt: at(7), auditorId: 4 },
        { id: 2, title: 'A1', scheduledAt: at(1), auditorId: null },
        { id: 3, title: 'A3', scheduledAt: at(3), auditorId: 4 },
      ]);
      expect(await service.sendReminders(now)).toBe(2);
      expect(notifications.notifyUsersOnce).toHaveBeenCalledTimes(1);
      expect(notifications.notifyUsersOnce.mock.calls[0][0]).toEqual([4]);
      expect(notifications.notifyRolesOnce).toHaveBeenCalledTimes(2);
      expect(notifications.notifyRolesOnce.mock.calls.map((c: any[]) => c[1].data.key)).toEqual(['audit-reminder:1:7', 'audit-reminder:2:1']);
    });
  });
});
