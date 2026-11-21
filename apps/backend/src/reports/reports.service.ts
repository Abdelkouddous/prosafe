import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../incidents/entities/incident.entity';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { Enrollment } from '../trainings/entities/enrollment.entity';
import { fmtDate, renderPdf, renderXlsx } from './report-renderers';
import { ReportData, ReportFormat, ReportKind, ReportQueryDto } from './reports.types';

export const MAX_ROWS = 5000;

const L: Record<string, Record<string, string>> = {
  type: {
    safety: 'Sécurité', security: 'Sûreté', hr_violation: 'Violation RH', environment: 'Environnement',
    near_miss: 'Presque-accident', equipment_failure: 'Défaillance équipement', other: 'Autre',
  },
  severity: { low: 'Faible', medium: 'Moyenne', high: 'Élevée', critical: 'Critique' },
  status: { open: 'En attente', investigating: 'En cours', resolved: 'Résolu', closed: 'Clôturé' },
  category: {
    ppe: 'EPI', fire_extinguisher: 'Extincteur', first_aid: 'Premiers secours', detection: 'Détection',
    signage: 'Signalisation', tools: 'Outillage', consumables: 'Consommables', other: 'Autre',
  },
  condition: { functional: 'Fonctionnel', non_functional: 'Non fonctionnel' },
  enrollment: { registered: 'Inscrit', attended: 'Présent', passed: 'Réussi', failed: 'Échoué', cancelled: 'Annulé' },
};
const label = (group: string, v: string | null | undefined) => (v ? (L[group]?.[v] ?? v) : '');
const count = <T>(rows: T[], key: (r: T) => string) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].map(([k, n]) => [k, n] as [string, number]);
};

const MIME: Record<ReportFormat, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Incident) private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(InventoryItem) private readonly itemRepo: Repository<InventoryItem>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  /** Builds the file for `kind`. Risks / audits arrive with Phase 4. */
  async generate(kind: ReportKind, q: ReportQueryDto, now = new Date()): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const format = q.format ?? 'pdf';
    const data = await this.collect(kind, q);
    const buffer = format === 'pdf' ? await renderPdf(data, now) : await renderXlsx(data, now);
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    return { buffer, filename: `prosafe-${kind}-${stamp}.${format}`, contentType: MIME[format] };
  }

  async collect(kind: ReportKind, q: ReportQueryDto): Promise<ReportData> {
    switch (kind) {
      case 'incidents':
        return this.incidents(q);
      case 'equipment':
        return this.equipment(q);
      case 'trainings':
        return this.trainings(q);
      default:
        throw new BadRequestException(`The ${kind} report is not available yet`);
    }
  }

  private periodLabel(q: ReportQueryDto): string {
    if (!q.from && !q.to) return 'Toutes les dates';
    return `${q.from ? `du ${fmtDate(q.from)}` : ''}${q.from && q.to ? ' ' : ''}${q.to ? `au ${fmtDate(q.to)}` : ''}`.trim();
  }

  private range(q: ReportQueryDto): { from?: Date; to?: Date; toExclusive: boolean } {
    const from = q.from ? new Date(q.from) : undefined;
    const to = q.to ? new Date(q.to) : undefined;
    const dateOnly = !!q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to);
    if (to && dateOnly) to.setUTCDate(to.getUTCDate() + 1);
    return { from, to, toExclusive: dateOnly };
  }

  private async incidents(q: ReportQueryDto): Promise<ReportData> {
    const { from, to, toExclusive } = this.range(q);
    const qb = this.incidentRepo
      .createQueryBuilder('i')
      .leftJoin('i.reporter', 'r')
      .addSelect(['r.id', 'r.firstName', 'r.lastName'])
      .orderBy('i.timestamp', 'DESC')
      .addOrderBy('i.id', 'DESC');
    if (from) qb.andWhere('i.timestamp >= :from', { from });
    if (to) qb.andWhere(`i.timestamp ${toExclusive ? '<' : '<='} :to`, { to });
    if (q.type) qb.andWhere('i.type = :type', { type: q.type });
    if (q.department) qb.andWhere('i.department = :dep', { dep: q.department });
    const total = await qb.getCount();
    const list = await qb.take(MAX_ROWS).getMany();

    return {
      kind: 'incidents',
      title: 'Rapport des incidents',
      periodLabel: this.periodLabel(q),
      filters: [q.type && `Type : ${label('type', q.type)}`, q.department && `Département : ${q.department}`].filter(Boolean) as string[],
      summary: [
        ['Total des incidents', total],
        ...count(list, (r) => label('status', r.status)).map(([k, n]) => [`Statut — ${k}`, n] as [string, number]),
        ...count(list, (r) => label('severity', r.severity)).map(([k, n]) => [`Gravité — ${k}`, n] as [string, number]),
        ...count(list, (r) => label('type', r.type)).map(([k, n]) => [`Type — ${k}`, n] as [string, number]),
      ],
      columns: [
        { header: 'Référence', width: 14 }, { header: 'Date', width: 9 }, { header: 'Type', width: 12 }, { header: 'Gravité', width: 8 },
        { header: 'Statut', width: 9 }, { header: 'Zone', width: 10 }, { header: 'Département', width: 11 }, { header: 'Déclarant', width: 13 },
        { header: 'Score de risque', width: 8 }, { header: 'Description', width: 30 },
      ],
      rows: list.map((i) => [
        i.incidentId, fmtDate(i.timestamp), label('type', i.type), label('severity', i.severity), label('status', i.status),
        i.zone ?? '', i.department ?? '', [i.reporter?.firstName, i.reporter?.lastName].filter(Boolean).join(' '), i.riskScore ?? '', i.description ?? '',
      ]),
      truncated: total > list.length,
    };
  }

  private async equipment(q: ReportQueryDto): Promise<ReportData> {
    const qb = this.itemRepo.createQueryBuilder('i').orderBy('i.category', 'ASC').addOrderBy('i.name', 'ASC');
    if (q.type) qb.andWhere('i.category = :cat', { cat: q.type });
    const total = await qb.getCount();
    const list = await qb.take(MAX_ROWS).getMany();
    const now = new Date();
    const expired = (i: InventoryItem) => !!i.expiryDate && new Date(i.expiryDate).getTime() < now.getTime();
    const overdue = (i: InventoryItem) => !!i.nextInspectionAt && i.nextInspectionAt.getTime() < now.getTime();

    return {
      kind: 'equipment',
      title: "Rapport des équipements",
      periodLabel: `Situation au ${fmtDate(now)}`,
      filters: [q.type && `Catégorie : ${label('category', q.type)}`].filter(Boolean) as string[],
      summary: [
        ['Total des équipements', total],
        ['Non fonctionnels', list.filter((i) => i.condition === 'non_functional').length],
        ['Expirés', list.filter(expired).length],
        ['Inspection en retard', list.filter(overdue).length],
        ['Stock bas / épuisé', list.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length],
      ],
      columns: [
        { header: 'Équipement', width: 20 }, { header: 'Catégorie', width: 12 }, { header: 'Emplacement', width: 14 }, { header: 'Quantité', width: 7 },
        { header: 'Seuil min.', width: 7 }, { header: 'État', width: 11 }, { header: 'Expiration', width: 9 }, { header: 'Dernière inspection', width: 10 },
        { header: 'Prochaine inspection', width: 10 },
      ],
      rows: list.map((i) => [
        i.name, label('category', i.category), i.location ?? '', i.quantity, i.min_stock_level, label('condition', i.condition),
        fmtDate(i.expiryDate), fmtDate(i.lastInspectionAt), fmtDate(i.nextInspectionAt),
      ]),
      truncated: total > list.length,
    };
  }

  private async trainings(q: ReportQueryDto): Promise<ReportData> {
    const { from, to, toExclusive } = this.range(q);
    const qb = this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoin('e.session', 's')
      .innerJoin('s.training', 't')
      .innerJoin('e.user', 'u')
      .addSelect(['s.id', 's.startAt', 't.id', 't.title', 't.category', 'u.id', 'u.firstName', 'u.lastName', 'u.department'])
      .orderBy('s.startAt', 'DESC')
      .addOrderBy('e.id', 'DESC');
    if (from) qb.andWhere('s.startAt >= :from', { from });
    if (to) qb.andWhere(`s.startAt ${toExclusive ? '<' : '<='} :to`, { to });
    if (q.type) qb.andWhere('t.category = :cat', { cat: q.type });
    if (q.department) qb.andWhere('u.department = :dep', { dep: q.department });
    const total = await qb.getCount();
    const list = await qb.take(MAX_ROWS).getMany();
    const now = Date.now();

    return {
      kind: 'trainings',
      title: 'Rapport des formations',
      periodLabel: this.periodLabel(q),
      filters: [q.type && `Catégorie : ${q.type}`, q.department && `Département : ${q.department}`].filter(Boolean) as string[],
      summary: [
        ['Total des inscriptions', total],
        ...count(list, (e) => label('enrollment', e.status)).map(([k, n]) => [`Statut — ${k}`, n] as [string, number]),
        ['Certifications expirées', list.filter((e) => e.expiresAt && e.expiresAt.getTime() < now).length],
      ],
      columns: [
        { header: 'Formation', width: 20 }, { header: 'Date de session', width: 10 }, { header: 'Employé', width: 16 }, { header: 'Département', width: 12 },
        { header: 'Statut', width: 9 }, { header: 'Score', width: 6 }, { header: 'Progression (%)', width: 8 }, { header: 'Expiration', width: 10 },
      ],
      rows: list.map((e) => [
        e.session?.training?.title ?? '', fmtDate(e.session?.startAt), [e.user?.firstName, e.user?.lastName].filter(Boolean).join(' '), e.user?.department ?? '',
        label('enrollment', e.status), e.score ?? '', e.progress, fmtDate(e.expiresAt),
      ]),
      truncated: total > list.length,
    };
  }
}
