import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

const qb = (rows: any[]) => {
  const q: any = {};
  for (const m of ['leftJoin', 'innerJoin', 'where', 'addSelect', 'orderBy', 'addOrderBy', 'andWhere', 'take']) q[m] = jest.fn().mockReturnValue(q);
  q.getCount = jest.fn().mockResolvedValue(rows.length);
  q.getMany = jest.fn().mockResolvedValue(rows);
  return q;
};

describe('ReportsService', () => {
  let service: ReportsService;
  const incidents = Array.from({ length: 80 }, (_, i) => ({
    incidentId: `INC-${i}`, timestamp: new Date('2026-01-05'), type: 'safety', severity: 'high', status: 'open', zone: 'A', department: 'Prod',
    reporter: { firstName: 'Ali', lastName: 'Ben' }, riskScore: 12, description: 'Chute à l\'atelier — description assez longue pour passer à la ligne '.repeat(2),
  }));
  const items = [{ name: 'Extincteur', category: 'fire_extinguisher', quantity: 2, min_stock_level: 1, condition: 'functional', status: 'active', expiryDate: '2020-01-01', nextInspectionAt: null, lastInspectionAt: null, location: 'Hall' }];
  const enrollments = [{ status: 'passed', progress: 100, score: 90, expiresAt: new Date('2030-01-01'), session: { startAt: new Date('2026-01-02'), training: { title: 'Incendie' } }, user: { firstName: 'A', lastName: 'B', department: 'Prod' } }];

  const risks = [{ title: 'Chute de hauteur', hazardCategory: 'chute', zone: 'A', department: null, gravity: 4, probability: 4, score: 16, level: 'critical', status: 'validated', recommendedMeasures: 'Harnais' }];
  const audits = [{ title: 'Audit interne T1', type: 'internal', standard: 'ISO 45001', scheduledAt: new Date('2026-01-10'), auditorName: 'Karim', auditor: null, zone: null, status: 'completed', score: 80 }];

  beforeEach(() => {
    service = new ReportsService({ createQueryBuilder: () => qb(incidents) } as any, { createQueryBuilder: () => qb(items) } as any, { createQueryBuilder: () => qb(enrollments) } as any, { createQueryBuilder: () => qb(risks) } as any, { createQueryBuilder: () => qb(audits) } as any);
  });

  it.each(['incidents', 'equipment', 'trainings', 'risks', 'audits'] as const)('%s: PDF is a non-empty %PDF buffer with a dated filename', async (kind) => {
    const r = await service.generate(kind, { format: 'pdf' }, new Date('2026-02-03T10:00:00Z'));
    expect(r.buffer.length).toBeGreaterThan(500);
    expect(r.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(r.contentType).toBe('application/pdf');
    expect(r.filename).toBe(`prosafe-${kind}-20260203.pdf`);
  });

  it('PDF tables paginate (80 long rows span several pages)', async () => {
    const r = await service.generate('incidents', { format: 'pdf' });
    const pages = (r.buffer.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;
    expect(pages).toBeGreaterThan(1);
  });

  it.each(['incidents', 'equipment', 'trainings', 'risks', 'audits'] as const)('%s: XLSX is a zip with the right content type', async (kind) => {
    const r = await service.generate(kind, { format: 'xlsx', from: '2026-01-01', to: '2026-01-31' }, new Date('2026-02-03T10:00:00Z'));
    expect(r.buffer.length).toBeGreaterThan(500);
    expect(r.buffer.subarray(0, 2).toString()).toBe('PK');
    expect(r.contentType).toContain('spreadsheetml');
    expect(r.filename).toBe(`prosafe-${kind}-20260203.xlsx`);
  });

  it('incidents data includes summary counts and French labels', async () => {
    const d = await service.collect('incidents', {});
    expect(d.summary[0]).toEqual(['Total des incidents', 80]);
    expect(d.rows[0][2]).toBe('Sécurité');
    expect(d.rows[0][3]).toBe('Élevée');
  });

  it('risks and audits data use French labels and summaries', async () => {
    const r = await service.collect('risks', {});
    expect(r.summary[0]).toEqual(['Total des risques', 1]);
    expect(r.rows[0][7]).toBe('Critique');
    const a = await service.collect('audits', {});
    expect(a.summary).toContainEqual(['Score moyen des audits terminés (%)', 80]);
    expect(a.rows[0][1]).toBe('Interne');
  });

  it('unknown kind is rejected', async () => {
    await expect(service.generate('nope' as any, {})).rejects.toBeInstanceOf(BadRequestException);
  });
});
