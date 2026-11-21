import { NotFoundException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentStatus } from './enums/incident-status.enum';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let repo: { findOne: jest.Mock; find: jest.Mock; save: jest.Mock };

  const incident = (status: IncidentStatus, extra = {}) => ({ incidentId: 'INC-1', reportedBy: 5, status, ...extra });

  beforeEach(() => {
    repo = { findOne: jest.fn(), find: jest.fn().mockResolvedValue([]), save: jest.fn().mockImplementation(async (i) => i) };
    service = new IncidentsService(repo as any, {} as any);
  });

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

  it('CLOSED sets resolvedAt / resolvedBy', async () => {
    repo.findOne.mockResolvedValue(incident(IncidentStatus.RESOLVED));
    const res = await service.updateStatus('INC-1', { status: IncidentStatus.CLOSED }, 9);
    expect(res.resolvedBy).toBe(9);
  });

  it('re-opening to INVESTIGATING clears the resolution fields', async () => {
    repo.findOne.mockResolvedValue(incident(IncidentStatus.RESOLVED, { resolvedAt: new Date(), resolvedBy: 4 }));
    const res = await service.updateStatus('INC-1', { status: IncidentStatus.INVESTIGATING }, 9);
    expect(res.resolvedAt).toBeNull();
    expect(res.resolvedBy).toBeNull();
  });

  it('findAll filters by reporter for employees only', async () => {
    await service.findAll(5);
    expect(repo.find).toHaveBeenLastCalledWith(expect.objectContaining({ where: { reportedBy: 5 } }));
    await service.findAll();
    expect(repo.find).toHaveBeenLastCalledWith(expect.objectContaining({ where: {} }));
  });

  it("findOne hides other users' incidents from employees", async () => {
    repo.findOne.mockResolvedValue(incident(IncidentStatus.OPEN));
    await expect(service.findOne('INC-1', 6)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findOne('INC-1', 5)).resolves.toBeDefined();
    await expect(service.findOne('INC-1')).resolves.toBeDefined();
  });
});
