/**
 * PROSAFE demo seed (client demo / acceptance tests).
 *
 *   pnpm seed             # seeds the database configured in .env
 *   pnpm seed -- --force  # allow running with NODE_ENV=production (never do this on real data)
 *
 * Creates an Algerian industrial site (Tébessa) with users, incidents, equipment, trainings, risks, audits,
 * drills, messages... Every account uses the password documented in README.md ("Demo data").
 * The run is skipped when the marker user `admin@prosafe.demo` already exists.
 */
import * as bcrypt from 'bcrypt';
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { deflateSync } from 'zlib';
import dataSource from '../config/data-source';
import { Alert } from '../alerts/entities/alert.entity';
import { AlertSeverity } from '../alerts/enums/alert-severity.enum';
import { AlertStatus } from '../alerts/enums/alert-status.enum';
import { AlertType } from '../alerts/enums/alert-type.enum';
import { Audit } from '../audits/entities/audit.entity';
import { AuditResponse } from '../audits/entities/audit-response.entity';
import { ChecklistTemplate } from '../audits/entities/checklist-template.entity';
import { ComplianceDocument } from '../audits/entities/compliance-document.entity';
import { summarizeResponses } from '../audits/audit-score';
import { AuditResult, AuditStatus, AuditType, ComplianceDocumentType } from '../audits/enums/audit.enums';
import { CorrectiveAction } from '../corrective-actions/entities/corrective-action.entity';
import { CorrectiveActionSource, CorrectiveActionStatus } from '../corrective-actions/enums/corrective-action.enums';
import { Drill } from '../emergency/entities/drill.entity';
import { EmergencyScenario } from '../emergency/entities/emergency-scenario.entity';
import { DrillStatus } from '../emergency/enums/emergency.enums';
import { Feedback } from '../feedback/entities/feedback.entity';
import { FeedbackCategory } from '../feedback/enums/feedback.enums';
import { StoredFile } from '../files/entities/stored-file.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { IncidentHistory } from '../incidents/entities/incident-history.entity';
import { IncidentMedia, IncidentMediaKind } from '../incidents/entities/incident-media.entity';
import { IncidentSeverity } from '../incidents/enums/incident-severity.enum';
import { IncidentStatus } from '../incidents/enums/incident-status.enum';
import { IncidentType } from '../incidents/enums/incident-type.enum';
import { InventoryItem } from '../inventory/entities/inventory.entity';
import { InventoryCategory } from '../inventory/enums/inventory-category.enum';
import { InventoryCondition } from '../inventory/enums/inventory-condition.enum';
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';
import { Maintenance } from '../maintenance/entities/maintenance.entity';
import { MaintenanceResult, MaintenanceStatus, MaintenanceType } from '../maintenance/enums/maintenance.enums';
import { Message } from '../messages/entities/message.entity';
import { MessageStatus } from '../messages/enums/message-status.enum';
import { Conversation, ConversationMessage, ConversationParticipant } from '../messaging/entities/conversation.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { Reward } from '../rewards/entities/reward.entity';
import { ActionPlan } from '../risks/entities/action-plan.entity';
import { LmraAssessment } from '../risks/entities/lmra-assessment.entity';
import { Risk } from '../risks/entities/risk.entity';
import { ActionPlanStatus, LmraDecision, RiskStatus } from '../risks/enums/risk.enums';
import { riskLevelFromScore } from '../risks/risk-level';
import { Enrollment } from '../trainings/entities/enrollment.entity';
import { Training } from '../trainings/entities/training.entity';
import { TrainingSession } from '../trainings/entities/training-session.entity';
import { EnrollmentStatus, SessionStatus } from '../trainings/enums/training.enums';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';

export const DEMO_PASSWORD = 'Prosafe2026!';
export const MARKER_EMAIL = 'admin@prosafe.demo';

const DAY = 24 * 3600 * 1000;
const now = new Date();
const ago = (days: number, hour?: number): Date => {
  const d = new Date(now.getTime() - days * DAY);
  if (hour !== undefined) d.setHours(hour, 15, 0, 0);
  return d;
};
const ahead = (days: number, hour = 9): Date => ago(-days, hour);
const dateOnly = (d: Date): string => d.toISOString().slice(0, 10);
const addMonths = (d: Date, m: number): Date => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
};

// Deterministic PRNG so every run produces the same demo data.
let seedState = 20260;
const rnd = (): number => {
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const jitter = (v: number, amp: number) => Math.round((v + (rnd() - 0.5) * 2 * amp) * 1e6) / 1e6;

// ---------------------------------------------------------------- placeholder files
function crc32(buf: Buffer): number {
  let c: number;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/** Small valid PNG (gradient). */
function makePng(w: number, h: number, rgb: [number, number, number]): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const f = 0.55 + 0.45 * ((x + y) / (w + h));
      raw[row + 1 + x * 3] = Math.round(rgb[0] * f);
      raw[row + 2 + x * 3] = Math.round(rgb[1] * f);
      raw[row + 3 + x * 3] = Math.round(rgb[2] * f);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}
/** One-page PDF with a valid xref table. */
function makePdf(title: string): Buffer {
  const text = title.replace(/[()\\]/g, ' ');
  const stream = `BT /F1 18 Tf 60 760 Td (${text}) Tj 0 -30 Td /F1 11 Tf (Document de demonstration PROSAFE - contenu fictif) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

// ---------------------------------------------------------------- seed
async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed demo data with NODE_ENV=production (use --force if you really mean it).');
    process.exit(1);
  }

  const ds = await dataSource.initialize();
  try {
    await ds.runMigrations();
    const existing = await ds.getRepository(User).findOne({ where: { email: MARKER_EMAIL } });
    if (existing) {
      console.log(`Seed marker user ${MARKER_EMAIL} already exists: nothing to do.`);
      return;
    }

    const uploadsDir = resolve(process.env.UPLOADS_DIR ?? 'uploads');
    mkdirSync(uploadsDir, { recursive: true });

    const counts: Record<string, number> = {};
    const count = (k: string, n: number) => (counts[k] = (counts[k] ?? 0) + n);

    await ds.transaction(async (em) => {
      const save = async <T>(entity: new () => T, rows: Partial<T>[]): Promise<T[]> => {
        const saved = await em.getRepository(entity as any).save(rows.map((r) => em.getRepository(entity as any).create(r as any)) as any);
        count(entity.name, saved.length);
        return saved as T[];
      };
      const one = async <T>(entity: new () => T, row: Partial<T>): Promise<T> => (await save(entity, [row]))[0];

      // ---------------------------------------------------------- users
      const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
      const mkUser = (firstName: string, lastName: string, email: string, roles: Role[], department: string, zone: string, phone: string) => ({
        firstName,
        lastName,
        email,
        roles,
        department,
        zone,
        phone,
        password: hash,
        isActive: true,
        emailVerified: true,
      });
      const [admin, salima, mourad, karim, amina, yacine, sofiane, nadia, rachid] = await save(User, [
        mkUser('Admin', 'PROSAFE', MARKER_EMAIL, [Role.ADMIN], 'Administration', 'Bureaux', '0555 00 00 01'),
        mkUser('Salima', 'Ouali', 'salima.ouali@prosafe.demo', [Role.SST_MANAGER], 'Administration', 'Bureaux', '0555 00 00 02'),
        mkUser('Mourad', 'Kaci', 'mourad.kaci@prosafe.demo', [Role.SST_MANAGER], 'Production', 'Atelier A', '0555 00 00 03'),
        mkUser('Karim', 'Benali', 'karim.benali@prosafe.demo', [Role.EMPLOYEE], 'Production', 'Atelier A', '0555 10 00 01'),
        mkUser('Amina', 'Boudiaf', 'amina.boudiaf@prosafe.demo', [Role.EMPLOYEE], 'Production', 'Atelier B', '0555 10 00 02'),
        mkUser('Yacine', 'Messaoudi', 'yacine.messaoudi@prosafe.demo', [Role.EMPLOYEE], 'Maintenance', 'Atelier A', '0555 10 00 03'),
        mkUser('Sofiane', 'Hamdi', 'sofiane.hamdi@prosafe.demo', [Role.EMPLOYEE], 'Logistique', 'Entrepôt', '0555 10 00 04'),
        mkUser('Nadia', 'Cherif', 'nadia.cherif@prosafe.demo', [Role.EMPLOYEE], 'Administration', 'Bureaux', '0555 10 00 05'),
        mkUser('Rachid', 'Taleb', 'rachid.taleb@prosafe.demo', [Role.EMPLOYEE], 'Maintenance', 'Atelier B', '0555 10 00 06'),
      ]);
      const employees = [karim, amina, yacine, sofiane, nadia, rachid];
      const managers = [salima, mourad];
      const byZone = (zone: string) => employees.filter((e) => e.zone === zone);

      // ---------------------------------------------------------- placeholder images (attached to some incidents)
      const imgColors: [number, number, number][] = [[230, 126, 34], [192, 57, 43], [127, 140, 141]];
      const imageFiles: StoredFile[] = [];
      for (let i = 0; i < imgColors.length; i++) {
        const buf = makePng(160, 110, imgColors[i]);
        const name = `seed-incident-photo-${i + 1}.png`;
        writeFileSync(join(uploadsDir, name), buf);
        imageFiles.push(await one(StoredFile, { path: name, originalName: name, mimeType: 'image/png', size: buf.length, uploadedById: karim.id }));
      }

      // ---------------------------------------------------------- incidents (40, last 12 months)
      type Tpl = [IncidentType, IncidentSeverity, string, string, string];
      const L = IncidentSeverity.LOW, M = IncidentSeverity.MEDIUM, H = IncidentSeverity.HIGH, C = IncidentSeverity.CRITICAL;
      const T = IncidentType;
      const tpls: Tpl[] = [
        [T.NEAR_MISS, L, 'Atelier A', 'Presque-accident : palette mal calée près du pont roulant', 'Palette retenue par un collègue avant la chute.'],
        [T.SAFETY, M, 'Atelier A', 'Glissade sur sol huileux devant la presse 3', 'Fuite d’huile hydraulique non signalée, sol non balisé.'],
        [T.EQUIPMENT_FAILURE, M, 'Atelier B', 'Arrêt d’urgence défaillant sur la découpeuse', 'Le bouton ne coupe pas immédiatement la machine.'],
        [T.SAFETY, L, 'Entrepôt', 'Chute de colis depuis le rayonnage C4', 'Aucun blessé, colis mal positionné.'],
        [T.NEAR_MISS, M, 'Entrepôt', 'Chariot élévateur croisant un piéton sans visibilité', 'Allée non matérialisée au sol.'],
        [T.SAFETY, H, 'Atelier A', 'Projection de particules lors du meulage sans lunettes', 'Irritation oculaire, soins à l’infirmerie.'],
        [T.ENVIRONMENT, M, 'Atelier B', 'Déversement de solvant lors du remplissage d’un fût', 'Absorbant utilisé, zone nettoyée.'],
        [T.EQUIPMENT_FAILURE, H, 'Atelier A', 'Câble électrique dénudé sur la rectifieuse', 'Machine consignée immédiatement.'],
        [T.SAFETY, L, 'Bureaux', 'Chute de plain-pied dans le couloir administratif', 'Câble d’alimentation traversant le passage.'],
        [T.NEAR_MISS, H, 'Atelier B', 'Charge suspendue passée au-dessus d’un opérateur', 'Procédure de levage non respectée.'],
        [T.SECURITY, L, 'Entrepôt', 'Porte du quai de chargement laissée ouverte la nuit', 'Aucun vol constaté.'],
        [T.SAFETY, M, 'Atelier A', 'Coupure à la main lors du changement de lame', 'Gants anti-coupure non portés.'],
        [T.EQUIPMENT_FAILURE, L, 'Entrepôt', 'Frein de transpalette électrique faible', 'Retiré du service pour réparation.'],
        [T.ENVIRONMENT, L, 'Atelier A', 'Fuite d’air comprimé importante sur le réseau', 'Nuisance sonore et perte d’énergie.'],
        [T.SAFETY, C, 'Atelier B', 'Départ de feu dans l’armoire électrique de l’atelier', 'Éteint à l’extincteur CO2, évacuation partielle.'],
        [T.NEAR_MISS, L, 'Bureaux', 'Multiprise surchargée en surchauffe au secrétariat', 'Débranchée avant tout incident.'],
        [T.SAFETY, M, 'Entrepôt', 'Entorse de la cheville en descendant du quai', 'Marche irrégulière non balisée.'],
        [T.HR_VIOLATION, M, 'Atelier A', 'Travail en hauteur sans harnais sur la passerelle', 'Rappel à l’ordre, formation à planifier.'],
        [T.EQUIPMENT_FAILURE, H, 'Atelier B', 'Rupture d’une élingue lors d’un levage à vide', 'Élingue détruite, contrôle de tout le lot.'],
        [T.ENVIRONMENT, M, 'Entrepôt', 'Odeur de produit chimique dans la zone de stockage', 'Bidon fissuré, zone ventilée.'],
        [T.NEAR_MISS, M, 'Atelier A', 'Outil tombé d’un échafaudage mobile', 'Aucun blessé, zone non délimitée.'],
        [T.SAFETY, H, 'Atelier B', 'Brûlure au second degré lors d’une soudure', 'Écran de protection absent.'],
        [T.SECURITY, M, 'Bureaux', 'Badge d’accès perdu et utilisé par un tiers', 'Badge désactivé.'],
        [T.EQUIPMENT_FAILURE, M, 'Atelier A', 'Extracteur de fumées de soudage hors service', 'Travaux suspendus dans la zone.'],
        [T.SAFETY, L, 'Atelier B', 'Bruit excessif près du compresseur sans protections auditives', 'Mesure à programmer.'],
        [T.NEAR_MISS, H, 'Entrepôt', 'Renversement évité d’un chariot élévateur en virage', 'Vitesse excessive dans l’allée centrale.'],
        [T.SAFETY, M, 'Atelier A', 'Lombalgie après manutention manuelle de fûts', 'Absence d’aide à la manutention.'],
        [T.ENVIRONMENT, L, 'Atelier B', 'Bac de rétention des huiles usagées presque plein', 'Vidange à planifier.'],
        [T.EQUIPMENT_FAILURE, C, 'Atelier A', 'Rupture du flexible hydraulique de la presse 2 sous pression', 'Jet d’huile à haute pression, opérateur indemne.'],
        [T.SAFETY, L, 'Bureaux', 'Chaise de bureau cassée, chute d’un employé', 'Contusion légère.'],
        [T.NEAR_MISS, M, 'Atelier B', 'Court-circuit évité lors d’un nettoyage à l’eau', 'Armoire non étanche.'],
        [T.HR_VIOLATION, L, 'Entrepôt', 'Fumeur dans la zone de stockage de cartons', 'Rappel de l’interdiction de fumer.'],
        [T.SAFETY, H, 'Entrepôt', 'Chute d’un opérateur depuis un escabeau mal calé', 'Fracture du poignet, arrêt de travail.'],
        [T.EQUIPMENT_FAILURE, M, 'Atelier B', 'Détecteur de fumée déclenché à tort dans l’atelier', 'Capteur encrassé, nettoyage effectué.'],
        [T.ENVIRONMENT, M, 'Atelier A', 'Rejet de poussières métalliques sans aspiration', 'Filtre colmaté.'],
        [T.NEAR_MISS, L, 'Bureaux', 'Porte coupe-feu bloquée ouverte par un extincteur', 'Remise en position fermée.'],
        [T.SAFETY, M, 'Atelier B', 'Pincement de doigt dans la plieuse', 'Protecteur mal réglé.'],
        [T.SAFETY, C, 'Entrepôt', 'Effondrement partiel d’un rayonnage chargé', 'Zone interdite, aucun blessé, rayonnage surchargé.'],
        [T.NEAR_MISS, M, 'Atelier A', 'Livraison de bouteilles de gaz mal arrimées', 'Bouteille tombée du camion sans dommage.'],
        [T.SAFETY, H, 'Atelier A', 'Intoxication légère aux vapeurs de peinture', 'Cabine de peinture mal ventilée.'],
        [T.EQUIPMENT_FAILURE, L, 'Bureaux', 'Détecteur de fumée du couloir sans pile', 'Pile remplacée.'],
      ];

      const nIncidents = tpls.length;
      const rootCauses = ['Défaut de maintenance préventive', 'Non-respect de la procédure', 'Équipement inadapté', 'Manque de formation', 'Signalisation insuffisante', 'Organisation du poste de travail'];
      const actionTitles = [
        'Mettre en place un balisage au sol',
        'Former l’équipe à la procédure concernée',
        'Remplacer l’équipement défectueux',
        'Ajouter une consigne affichée au poste',
        'Contrôler l’ensemble des équipements similaires',
        'Revoir le plan de maintenance préventive',
      ];

      const incidentRows: Incident[] = [];
      const historyRows: Partial<IncidentHistory>[] = [];
      const rewardRows: Partial<Reward>[] = [];
      const mediaRows: Partial<IncidentMedia>[] = [];
      const alertRows: Partial<Alert>[] = [];
      const caPending: { idx: number; rows: Partial<CorrectiveAction>[] }[] = [];

      let rejectedLeft = 2;
      const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
      for (let i = 0; i < nIncidents; i++) {
        const [type, severity, zone, description, notes] = tpls[i];
        const daysAgo = i === nIncidents - 1 ? 0.1 : Math.floor(362 * Math.pow((nIncidents - 1 - i) / (nIncidents - 1), 1.25)) + int(0, 2);
        const timestamp = daysAgo < 1 ? new Date(now.getTime() - 3 * 3600 * 1000) : ago(daysAgo, int(7, 16));
        const reporter = pick(byZone(zone).length ? byZone(zone) : employees);
        // status by age
        let status: IncidentStatus;
        const r = rnd();
        if (daysAgo > 75) status = r < 0.72 ? IncidentStatus.CLOSED : IncidentStatus.RESOLVED;
        else if (daysAgo > 15) status = r < 0.3 ? IncidentStatus.CLOSED : r < 0.6 ? IncidentStatus.RESOLVED : IncidentStatus.INVESTIGATING;
        else status = r < 0.5 ? IncidentStatus.OPEN : IncidentStatus.INVESTIGATING;
        // keep the most critical ones visibly unresolved for the demo
        if (i === 14 || i === 39) status = IncidentStatus.INVESTIGATING;
        if (i === 28) status = IncidentStatus.CLOSED;
        let rejected = false;
        if (status === IncidentStatus.CLOSED && rejectedLeft > 0 && severity === L && [8, 10, 31, 15].includes(i)) {
          rejected = true;
          rejectedLeft--;
        }
        const hasCoords = rnd() < 0.78;
        const algiers = hasCoords && i % 5 === 3;
        const lat = hasCoords ? (algiers ? jitter(36.75, 0.02) : jitter(35.4, 0.015)) : null;
        const lng = hasCoords ? (algiers ? jitter(3.06, 0.02) : jitter(8.12, 0.015)) : null;
        const resolvedAt =
          status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED
            ? new Date(Math.min(timestamp.getTime() + (4 + rnd() * 24 * 9) * 3600 * 1000, now.getTime() - 3600 * 1000))
            : null;
        const evaluated = !rejected && status !== IncidentStatus.OPEN;
        const gravity = evaluated ? { low: int(1, 2), medium: int(2, 3), high: int(3, 5), critical: int(4, 5) }[severity] : null;
        const probability = evaluated ? { low: int(1, 3), medium: int(2, 3), high: int(3, 4), critical: int(3, 5) }[severity] : null;
        const evalAt = evaluated ? new Date(timestamp.getTime() + int(6, 48) * 3600 * 1000) : null;
        const incidentId = `INC-${stamp}-${String(i + 1).padStart(3, '0')}`;
        const inc = em.getRepository(Incident).create({
          incidentId,
          notes,
          zone,
          department: reporter.department,
          description,
          type,
          severity,
          timestamp,
          reportedBy: reporter.id,
          status,
          rejected,
          geoLatitude: lat as any,
          geoLongitude: lng as any,
          manualAddress: hasCoords ? null : `${zone}, site industriel de Tébessa`,
          createdAt: new Date(timestamp.getTime() + 10 * 60 * 1000),
          resolvedAt,
          resolvedBy: resolvedAt ? pick(managers).id : null,
          gravity,
          probability,
          riskScore: evaluated ? gravity * probability : null,
          rootCause: evaluated ? pick(rootCauses) : null,
          evaluatedSeverity: evaluated ? severity : null,
          evaluatedById: evaluated ? pick(managers).id : null,
          evaluatedAt: evalAt,
        } as any) as unknown as Incident;
        incidentRows.push(inc);
      }
      const savedIncidents = await save(Incident, incidentRows as any);

      for (let i = 0; i < savedIncidents.length; i++) {
        const inc = savedIncidents[i];
        const t0 = inc.createdAt;
        const mgr = pick(managers).id;
        const hist = (from: IncidentStatus | null, to: IncidentStatus, afterHours: number, comment: string | null, by: number) =>
          historyRows.push({ incidentRefId: inc.id, fromStatus: from, toStatus: to, comment, changedById: by, changedAt: new Date(t0.getTime() + afterHours * 3600 * 1000) });
        hist(null, IncidentStatus.OPEN, 0, 'Incident signalé', inc.reportedBy);
        if (inc.status === IncidentStatus.CLOSED && inc.rejected) {
          hist(IncidentStatus.OPEN, IncidentStatus.CLOSED, 20, 'Signalement rejeté : doublon / hors périmètre SST', mgr);
        } else {
          if (inc.status !== IncidentStatus.OPEN) hist(IncidentStatus.OPEN, IncidentStatus.INVESTIGATING, 8, 'Prise en charge par le responsable SST', mgr);
          if (inc.status === IncidentStatus.RESOLVED || inc.status === IncidentStatus.CLOSED) hist(IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED, 48, 'Mesures correctives mises en place', mgr);
          if (inc.status === IncidentStatus.CLOSED) hist(IncidentStatus.RESOLVED, IncidentStatus.CLOSED, 96, 'Clôture après vérification', mgr);
        }

        // rewards: replicate RewardsService rules (severity + 3 photo + 2 location); revoked when rejected
        const hasPhoto = i % 3 === 0;
        const hasLocation = inc.geoLatitude !== null && inc.geoLatitude !== undefined;
        const base = { low: 5, medium: 8, high: 12, critical: 15 }[inc.severity];
        const points = base + (hasPhoto ? 3 : 0) + (hasLocation ? 2 : 0);
        rewardRows.push({
          user_id: inc.reportedBy,
          incidentId: inc.incidentId,
          points: inc.rejected ? 0 : points,
          reason: inc.rejected ? 'incident_rejected' : 'incident_report',
          created_at: t0,
        });
        if (hasPhoto) mediaRows.push({ incidentRefId: inc.id, fileId: imageFiles[(i / 3) % imageFiles.length | 0].id, kind: IncidentMediaKind.IMAGE });

        // corrective actions for evaluated incidents
        if (inc.evaluatedAt && (inc.severity === H || inc.severity === C || i % 2 === 0)) {
          const done = inc.status === IncidentStatus.RESOLVED || inc.status === IncidentStatus.CLOSED;
          const due = new Date(t0.getTime() + int(14, 30) * DAY);
          caPending.push({
            idx: i,
            rows: [
              {
                sourceType: CorrectiveActionSource.INCIDENT,
                sourceId: inc.id,
                title: actionTitles[i % actionTitles.length],
                description: `Action issue de l’incident ${inc.incidentId}.`,
                ownerId: pick(managers).id,
                dueDate: due,
                status: done ? CorrectiveActionStatus.DONE : i % 2 ? CorrectiveActionStatus.IN_PROGRESS : CorrectiveActionStatus.TODO,
                doneAt: done ? new Date(Math.min(due.getTime() - 2 * DAY, now.getTime())) : null,
                createdById: inc.evaluatedById,
                createdAt: inc.evaluatedAt,
              },
            ],
          });
        }

        // alerts for critical incidents
        if (inc.severity === C) {
          const open = inc.status === IncidentStatus.INVESTIGATING || inc.status === IncidentStatus.OPEN;
          alertRows.push({
            title: `Incident critique ${inc.incidentId}`,
            description: inc.description,
            severity: AlertSeverity.CRITICAL,
            status: open ? AlertStatus.UNRESOLVED : AlertStatus.RESOLVED,
            type: AlertType.CRITICAL_INCIDENT,
            metadata: { incidentId: inc.incidentId, id: inc.id },
            resolved_by_id: open ? null : managers[0].id,
            resolved_at: open ? null : inc.resolvedAt,
            created_at: t0,
          } as any);
        }
      }
      await save(IncidentHistory, historyRows);
      await save(Reward, rewardRows);
      await save(IncidentMedia, mediaRows);
      await save(CorrectiveAction, caPending.flatMap((c) => c.rows));

      // ---------------------------------------------------------- equipment (25) and maintenance
      type Eq = [string, InventoryCategory, number, number, number, string, string, number | null, boolean, number | null, number | null];
      const P = InventoryCategory.PPE, F = InventoryCategory.FIRE_EXTINGUISHER, A = InventoryCategory.FIRST_AID, D = InventoryCategory.DETECTION, S = InventoryCategory.SIGNAGE;
      // name, category, qty, min, price(DA), location, supplier, expiry in days, functional, lastInspection (days ago), nextInspection (days from now)
      const eqs: Eq[] = [
        ['Casque de chantier blanc', P, 48, 15, 1200, 'Magasin EPI', 'SECURIMED Alger', null, true, null, null],
        ['Gants anti-coupure niveau 5', P, 12, 20, 850, 'Magasin EPI', 'SECURIMED Alger', null, true, null, null],
        ['Lunettes de protection panoramiques', P, 36, 15, 600, 'Magasin EPI', 'SECURIMED Alger', null, true, null, null],
        ['Chaussures de sécurité S3 (pointure 42)', P, 3, 6, 6500, 'Magasin EPI', 'EPI Algérie', null, true, null, null],
        ['Bouchons d’oreilles (boîte de 200)', P, 0, 2, 3200, 'Magasin EPI', 'EPI Algérie', 500, true, null, null],
        ['Harnais antichute 2 points', P, 8, 4, 14500, 'Atelier A', 'Hauteur Sécurité', 700, true, 120, 60],
        ['Masque à cartouche A2P3', P, 14, 10, 4800, 'Atelier B', 'EPI Algérie', 250, true, null, null],
        ['Extincteur CO2 5 kg - Atelier A', F, 1, 1, 18000, 'Atelier A', 'Protec Incendie Tébessa', 400, true, 170, 195],
        ['Extincteur CO2 5 kg - Atelier B', F, 1, 1, 18000, 'Atelier B', 'Protec Incendie Tébessa', 400, false, 200, 25],
        ['Extincteur poudre ABC 9 kg - Entrepôt (Nord)', F, 1, 1, 9500, 'Entrepôt', 'Protec Incendie Tébessa', 20, true, 350, -15],
        ['Extincteur poudre ABC 9 kg - Entrepôt (Sud)', F, 1, 1, 9500, 'Entrepôt', 'Protec Incendie Tébessa', 320, true, 90, 270],
        ['Extincteur eau pulvérisée 6 L - Bureaux', F, 2, 2, 7200, 'Bureaux', 'Protec Incendie Tébessa', 540, true, 60, 300],
        ['Trousse de premiers secours - Atelier A', A, 1, 1, 5600, 'Atelier A', 'Pharma Médical Tébessa', 18, true, 100, 80],
        ['Trousse de premiers secours - Entrepôt', A, 1, 1, 5600, 'Entrepôt', 'Pharma Médical Tébessa', 280, true, 100, 80],
        ['Trousse de premiers secours - Bureaux', A, 1, 1, 4200, 'Bureaux', 'Pharma Médical Tébessa', 340, true, 100, 80],
        ['Défibrillateur automatisé externe', A, 1, 1, 95000, 'Bureaux', 'Cardio Santé Algérie', 25, true, 30, 150],
        ['Collyre de rinçage oculaire (station)', A, 4, 2, 7800, 'Atelier B', 'Pharma Médical Tébessa', 150, true, null, null],
        ['Détecteur de fumée optique (couloir)', D, 6, 4, 2800, 'Bureaux', 'Sécurité Globale DZ', null, true, 150, 30],
        ['Détecteur de gaz portable (CO / H2S)', D, 2, 2, 62000, 'Atelier B', 'Sécurité Globale DZ', 300, true, 45, 135],
        ['Détecteur de gaz fixe - local chaudière', D, 1, 1, 38000, 'Atelier A', 'Sécurité Globale DZ', null, true, 220, -10],
        ['Panneau d’évacuation photoluminescent', S, 3, 5, 950, 'Magasin SST', 'Signalétique Maghreb', null, true, null, null],
        ['Panneau « Port du casque obligatoire »', S, 18, 6, 450, 'Magasin SST', 'Signalétique Maghreb', null, true, null, null],
        ['Ruban de balisage rouge/blanc (rouleau)', S, 5, 5, 700, 'Magasin SST', 'Signalétique Maghreb', null, true, null, null],
        ['Kit anti-déversement chimique', InventoryCategory.CONSUMABLES, 7, 3, 11500, 'Atelier B', 'Eco Protect Algérie', 365, true, null, null],
        ['Lampe de secours autonome', S, 20, 8, 1800, 'Atelier A', 'Sécurité Globale DZ', null, true, 160, 20],
      ];
      const inventory = await save(
        InventoryItem,
        eqs.map(([name, category, qty, min, price, location, supplier, expDays, ok, lastIns, nextIns], i) => ({
          name,
          sku: `PRS-${category.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          description: `${name} - équipement du site (démonstration).`,
          price,
          quantity: qty,
          min_stock_level: min,
          category,
          status: qty === 0 ? InventoryStatus.OUT_OF_STOCK : qty <= min && category !== F && category !== A && category !== D ? InventoryStatus.LOW_STOCK : InventoryStatus.ACTIVE,
          condition: ok ? InventoryCondition.FUNCTIONAL : InventoryCondition.NON_FUNCTIONAL,
          expiryDate: expDays === null ? null : dateOnly(new Date(now.getTime() + expDays * DAY)),
          lastInspectionAt: lastIns === null ? null : ago(lastIns),
          nextInspectionAt: nextIns === null ? null : ahead(nextIns),
          supplier,
          location,
          created_by_id: managers[0].id,
          updated_by_id: managers[0].id,
        })),
      );
      const item = (needle: string) => inventory.find((x) => x.name.startsWith(needle))!;

      const mt = (it: InventoryItem, type: MaintenanceType, scheduledAgo: number, status: MaintenanceStatus, result: MaintenanceResult | null, notes: string | null, by: User | null) => ({
        itemId: it.id,
        type,
        scheduledAt: scheduledAgo >= 0 ? ago(scheduledAgo, 9) : ahead(-scheduledAgo, 9),
        doneAt: status === MaintenanceStatus.DONE ? ago(scheduledAgo - 1, 11) : null,
        performedById: by?.id ?? null,
        result,
        notes,
        status,
      });
      await save(Maintenance, [
        // history (done)
        mt(item('Extincteur CO2 5 kg - Atelier A'), MaintenanceType.INSPECTION, 170, MaintenanceStatus.DONE, MaintenanceResult.OK, 'Pression et plomb de scellement conformes.', yacine),
        mt(item('Extincteur CO2 5 kg - Atelier B'), MaintenanceType.INSPECTION, 200, MaintenanceStatus.DONE, MaintenanceResult.ISSUES, 'Buse endommagée, remplacement à prévoir.', rachid),
        mt(item('Extincteur poudre ABC 9 kg - Entrepôt (Nord)'), MaintenanceType.INSPECTION, 350, MaintenanceStatus.DONE, MaintenanceResult.OK, null, yacine),
        mt(item('Extincteur poudre ABC 9 kg - Entrepôt (Sud)'), MaintenanceType.PREVENTIVE, 90, MaintenanceStatus.DONE, MaintenanceResult.OK, 'Recharge annuelle effectuée.', rachid),
        mt(item('Détecteur de fumée optique'), MaintenanceType.PREVENTIVE, 150, MaintenanceStatus.DONE, MaintenanceResult.OK, 'Test de déclenchement sur les 6 détecteurs.', yacine),
        mt(item('Détecteur de gaz portable'), MaintenanceType.INSPECTION, 45, MaintenanceStatus.DONE, MaintenanceResult.OK, 'Étalonnage vérifié.', rachid),
        mt(item('Défibrillateur'), MaintenanceType.INSPECTION, 30, MaintenanceStatus.DONE, MaintenanceResult.OK, 'Électrodes et batterie valides.', yacine),
        mt(item('Harnais antichute'), MaintenanceType.INSPECTION, 120, MaintenanceStatus.DONE, MaintenanceResult.ISSUES, '1 harnais réformé (sangle usée).', rachid),
        mt(item('Lampe de secours'), MaintenanceType.PREVENTIVE, 160, MaintenanceStatus.DONE, MaintenanceResult.FAILED, '4 lampes à remplacer (batterie HS).', yacine),
        // overdue
        mt(item('Extincteur poudre ABC 9 kg - Entrepôt (Nord)'), MaintenanceType.PREVENTIVE, 15, MaintenanceStatus.OVERDUE, null, 'Révision annuelle à réaliser.', null),
        mt(item('Détecteur de gaz fixe'), MaintenanceType.INSPECTION, 10, MaintenanceStatus.OVERDUE, null, 'Contrôle semestriel en retard.', null),
        mt(item('Lampe de secours'), MaintenanceType.CORRECTIVE, 5, MaintenanceStatus.OVERDUE, null, 'Remplacement des batteries.', null),
        // planned
        mt(item('Extincteur CO2 5 kg - Atelier B'), MaintenanceType.CORRECTIVE, -5, MaintenanceStatus.PLANNED, null, 'Remplacement de la buse ou de l’extincteur.', null),
        mt(item('Détecteur de fumée optique'), MaintenanceType.INSPECTION, -30, MaintenanceStatus.PLANNED, null, null, null),
        mt(item('Harnais antichute'), MaintenanceType.INSPECTION, -60, MaintenanceStatus.PLANNED, null, null, null),
        mt(item('Trousse de premiers secours - Atelier A'), MaintenanceType.PREVENTIVE, -12, MaintenanceStatus.PLANNED, null, 'Remplacer les produits périmés.', null),
        mt(item('Défibrillateur'), MaintenanceType.INSPECTION, -150, MaintenanceStatus.PLANNED, null, null, null),
      ]);

      // ---------------------------------------------------------- trainings
      const [incendie, epi, secours, hauteur, chimie] = await save(Training, [
        { title: 'Sécurité incendie', description: 'Prévention, extincteurs, évacuation et rôle du guide-file.', category: 'Sécurité', durationHours: 4, validityMonths: 12, mandatoryForRoles: ['employee', 'sst_manager'], isActive: true },
        { title: 'Port des EPI', description: 'Choix, port et entretien des équipements de protection individuelle.', category: 'Prévention', durationHours: 3, validityMonths: 24, mandatoryForRoles: ['employee'], isActive: true },
        { title: 'Premiers secours (SST)', description: 'Sauveteur secouriste du travail : alerter, protéger, secourir.', category: 'Secourisme', durationHours: 14, validityMonths: 36, mandatoryForRoles: ['sst_manager'], isActive: true },
        { title: 'Travail en hauteur', description: 'Utilisation des harnais, échafaudages et nacelles.', category: 'Sécurité', durationHours: 7, validityMonths: 12, mandatoryForRoles: [], isActive: true },
        { title: 'Manipulation des produits chimiques', description: 'Étiquetage SGH, FDS, stockage et gestion des déversements.', category: 'Risques chimiques', durationHours: 6, validityMonths: 24, mandatoryForRoles: [], isActive: true },
      ]);
      const mkSession = (tr: Training, startDays: number, status: SessionStatus, location: string, trainer: string, capacity: number | null) => ({
        trainingId: tr.id,
        startAt: startDays >= 0 ? ago(startDays, 9) : ahead(-startDays, 9),
        endAt: new Date((startDays >= 0 ? ago(startDays, 9) : ahead(-startDays, 9)).getTime() + (tr.durationHours ?? 4) * 3600 * 1000),
        location,
        trainer,
        capacity,
        status,
      });
      const CP = SessionStatus.COMPLETED, PL = SessionStatus.PLANNED;
      const sessions = await save(TrainingSession, [
        mkSession(incendie, 350, CP, 'Salle de formation', 'Cdt Brahim Zerrouki (Protection civile)', 15), // 0
        mkSession(incendie, 120, CP, 'Salle de formation', 'Cdt Brahim Zerrouki (Protection civile)', 15), // 1
        mkSession(incendie, -10, PL, 'Salle de formation', 'Cdt Brahim Zerrouki (Protection civile)', 15), // 2
        mkSession(epi, 710, CP, 'Atelier A', 'Salima Ouali', 20), // 3
        mkSession(epi, 200, CP, 'Atelier A', 'Salima Ouali', 20), // 4
        mkSession(epi, -14, PL, 'Salle de formation', 'Salima Ouali', 20), // 5
        mkSession(secours, 400, CP, 'Centre de formation CRA Tébessa', 'Croissant-Rouge Algérien', 12), // 6
        mkSession(secours, -30, PL, 'Centre de formation CRA Tébessa', 'Croissant-Rouge Algérien', 12), // 7
        mkSession(hauteur, 420, CP, 'Atelier B', 'Hauteur Sécurité', 10), // 8
        mkSession(hauteur, 60, CP, 'Atelier B', 'Hauteur Sécurité', 10), // 9
        mkSession(hauteur, -20, PL, 'Atelier B', 'Hauteur Sécurité', 10), // 10
        mkSession(chimie, 150, CP, 'Salle de formation', 'Dr Leïla Mansouri', 15), // 11
        mkSession(chimie, -45, PL, 'Salle de formation', 'Dr Leïla Mansouri', 15), // 12
      ]);
      const trainingOf = (s: TrainingSession) => [incendie, epi, secours, hauteur, chimie].find((t) => t.id === s.trainingId)!;
      type En = [number, User, EnrollmentStatus, number | null];
      const PA = EnrollmentStatus.PASSED, RG = EnrollmentStatus.REGISTERED, FA = EnrollmentStatus.FAILED;
      const enrolSpec: En[] = [
        [0, karim, PA, 88], [0, sofiane, FA, 48],
        [1, amina, PA, 92], [1, yacine, PA, 85], [1, sofiane, PA, 78], [1, rachid, PA, 90], [1, salima, PA, 95], [1, mourad, PA, 91],
        [2, nadia, RG, null],
        [3, amina, PA, 80],
        [4, karim, PA, 87], [4, yacine, PA, 83], [4, sofiane, PA, 90], [4, nadia, PA, 94], [4, salima, PA, 96], [4, mourad, PA, 89],
        [5, rachid, RG, null],
        [6, salima, PA, 97], [6, mourad, PA, 93], [6, karim, PA, 82], [6, sofiane, PA, 75],
        [7, amina, RG, null], [7, nadia, RG, null],
        [8, yacine, PA, 86],
        [9, rachid, PA, 84],
        [10, yacine, RG, null],
        [11, karim, PA, 81], [11, amina, PA, 88], [11, rachid, PA, 79],
        [12, sofiane, RG, null], [12, yacine, RG, null],
      ];
      await save(
        Enrollment,
        enrolSpec.map(([si, user, status, score]) => {
          const s = sessions[si];
          const tr = trainingOf(s);
          const done = status === PA || status === FA;
          return {
            sessionId: s.id,
            userId: user.id,
            status,
            score,
            progress: done ? 100 : 0,
            completedAt: done ? s.endAt : null,
            expiresAt: status === PA && tr.validityMonths ? addMonths(s.endAt!, tr.validityMonths) : null,
          };
        }),
      );

      // ---------------------------------------------------------- risks, action plans, LMRA
      type Rk = [string, string, string, string, number, number, RiskStatus, number | null, string, number];
      const V = RiskStatus.VALIDATED;
      const rkSpec: Rk[] = [
        ['Chute de plain-pied sur sol glissant', 'Chute', 'Atelier A', 'Production', 3, 4, V, null, 'Nettoyage immédiat des fuites, bacs de rétention, sols antidérapants.', 300],
        ['Écrasement par chariot élévateur', 'Mécanique', 'Entrepôt', 'Logistique', 5, 3, V, null, 'Allées piétonnes matérialisées, limitation de vitesse, gilets haute visibilité.', 280],
        ['Incendie de l’armoire électrique', 'Incendie', 'Atelier B', 'Maintenance', 5, 4, V, null, 'Thermographie annuelle, extincteur CO2 à proximité, consignation.', 260],
        ['Exposition aux vapeurs de solvants', 'Chimique', 'Atelier A', 'Production', 4, 3, V, null, 'Ventilation locale, masques A2P3, remplacement des solvants.', 230],
        ['Chute de hauteur sur la passerelle', 'Chute de hauteur', 'Atelier A', 'Maintenance', 5, 3, V, null, 'Garde-corps, harnais obligatoire, formation travail en hauteur.', 210],
        ['Surdité professionnelle (bruit compresseur)', 'Bruit', 'Atelier B', 'Production', 3, 4, V, null, 'Capotage du compresseur, protections auditives, mesures de bruit.', 190],
        ['Coupure lors des opérations de découpe', 'Mécanique', 'Atelier B', 'Production', 3, 3, V, null, 'Gants anti-coupure niveau 5, protecteurs de lame.', 150],
        ['Troubles musculo-squelettiques (manutention)', 'Ergonomie', 'Entrepôt', 'Logistique', 3, 3, V, null, 'Aides à la manutention, formation gestes et postures.', 120],
        ['Effondrement de rayonnage', 'Mécanique', 'Entrepôt', 'Logistique', 5, 2, RiskStatus.MITIGATED, null, 'Charges maximales affichées, inspection trimestrielle.', 330],
        ['Câbles au sol dans les bureaux', 'Électrique', 'Bureaux', 'Administration', 2, 3, RiskStatus.ARCHIVED, null, 'Goulottes passe-câbles installées.', 340],
        ['Fuite de gaz près du local chaudière', 'Chimique', 'Atelier A', 'Maintenance', 4, 2, RiskStatus.PROPOSED, 3, 'Détecteur de gaz fixe à contrôler, ventilation.', 20],
        ['Projection de particules lors du meulage', 'Mécanique', 'Atelier A', 'Production', 3, 3, RiskStatus.PROPOSED, 0, 'Écrans de protection, lunettes obligatoires.', 8],
      ];
      const proposers = [karim, amina, yacine, sofiane];
      const risks = await save(
        Risk,
        rkSpec.map(([title, hazardCategory, zone, department, gravity, probability, status, prop, recommendedMeasures, daysAgo]) => ({
          title,
          description: `${title} (zone ${zone}).`,
          hazardCategory,
          zone,
          department,
          gravity,
          probability,
          score: gravity * probability,
          level: riskLevelFromScore(gravity * probability),
          recommendedMeasures,
          status,
          proposedById: status === RiskStatus.PROPOSED ? proposers[prop as number].id : pick(managers).id,
          validatedById: status === RiskStatus.PROPOSED ? null : pick(managers).id,
          createdAt: ago(daysAgo),
        })),
      );
      const AP = ActionPlanStatus;
      await save(ActionPlan, [
        { riskId: risks[0].id, title: 'Installer des bacs de rétention sous les presses', ownerId: mourad.id, dueDate: ago(30), status: AP.VALIDATED, progress: 100 },
        { riskId: risks[1].id, title: 'Peindre les allées piétonnes et installer des miroirs', ownerId: salima.id, dueDate: ahead(15), status: AP.IN_PROGRESS, progress: 60 },
        { riskId: risks[2].id, title: 'Réaliser une thermographie des armoires électriques', ownerId: mourad.id, dueDate: ago(10), status: AP.IN_PROGRESS, progress: 40 },
        { riskId: risks[3].id, title: 'Installer une extraction locale des vapeurs', ownerId: mourad.id, dueDate: ahead(45), status: AP.PLANNED, progress: 0 },
        { riskId: risks[4].id, title: 'Poser des garde-corps sur la passerelle', ownerId: salima.id, dueDate: ahead(20), status: AP.IN_PROGRESS, progress: 70 },
        { riskId: risks[5].id, title: 'Capoter le compresseur', ownerId: mourad.id, dueDate: ahead(60), status: AP.PLANNED, progress: 10 },
        { riskId: risks[8].id, title: 'Contrôle trimestriel des rayonnages', ownerId: salima.id, dueDate: ago(45), status: AP.COMPLETED, progress: 100 },
        { riskId: risks[7].id, title: 'Former les magasiniers aux gestes et postures', ownerId: salima.id, dueDate: ahead(35), status: AP.PLANNED, progress: 0 },
      ]);
      await save(LmraAssessment, [
        {
          userId: yacine.id,
          task: 'Remplacement du flexible hydraulique de la presse 2',
          location: 'Atelier A',
          hazards: [{ label: 'Pression résiduelle', present: true, controlled: true }, { label: 'Huile chaude', present: true, controlled: true }, { label: 'Consignation électrique', present: true, controlled: true }],
          decision: LmraDecision.GO,
          comments: 'Machine consignée et purgée.',
          riskIds: [],
          createdAt: ago(12, 8),
        },
        {
          userId: rachid.id,
          task: 'Travail sur la passerelle de l’atelier B',
          location: 'Atelier B',
          hazards: [{ label: 'Chute de hauteur', present: true, controlled: false }, { label: 'Sol glissant', present: true, controlled: true }],
          decision: LmraDecision.STOP,
          comments: 'Harnais non disponible, intervention reportée.',
          riskIds: [risks[4].id],
          createdAt: ago(7, 10),
        },
        {
          userId: karim.id,
          task: 'Nettoyage de la presse 3 à l’air comprimé',
          location: 'Atelier A',
          hazards: [{ label: 'Projection de particules', present: true, controlled: true }, { label: 'Bruit', present: true, controlled: true }],
          decision: LmraDecision.GO,
          comments: null,
          riskIds: [],
          createdAt: ago(2, 14),
        },
      ]);

      // ---------------------------------------------------------- audits and compliance documents
      const template = await em.getRepository(ChecklistTemplate).findOne({ where: { standard: 'ISO 45001' } });
      const [audit1, audit2] = await save(Audit, [
        { title: 'Audit interne ISO 45001 - Production et Maintenance', type: AuditType.INTERNAL, standard: 'ISO 45001', scheduledAt: ago(62, 9), auditorName: 'Salima Ouali', auditorId: salima.id, zone: 'Atelier A', status: AuditStatus.COMPLETED, templateId: template?.id ?? null, completedAt: ago(60, 16), createdById: admin.id },
        { title: 'Audit externe de certification ISO 45001', type: AuditType.EXTERNAL, standard: 'ISO 45001', scheduledAt: ahead(30, 9), auditorName: 'Bureau Veritas Algérie', auditorId: null, zone: null, status: AuditStatus.PLANNED, templateId: template?.id ?? null, completedAt: null, createdById: admin.id },
      ]);
      if (template) {
        const items = template.items;
        const ncIdx = new Set([3, 8, 17]); // non-conformities
        const naIdx = new Set([14, 22]);
        const results = items.map((_, i) => (ncIdx.has(i) ? AuditResult.NON_CONFORM : naIdx.has(i) ? AuditResult.NOT_APPLICABLE : AuditResult.CONFORM));
        const responses: Partial<AuditResponse>[] = [];
        for (let i = 0; i < items.length; i++) {
          let correctiveActionId: number | null = null;
          if (results[i] === AuditResult.NON_CONFORM) {
            const ca = await one(CorrectiveAction, {
              sourceType: CorrectiveActionSource.AUDIT,
              sourceId: audit1.id,
              title: `Non-conformité ${items[i].clause} : traiter l’écart constaté`,
              description: items[i].question,
              ownerId: salima.id,
              dueDate: i === 3 ? ago(5) : ahead(25),
              status: i === 3 ? CorrectiveActionStatus.IN_PROGRESS : CorrectiveActionStatus.TODO,
              createdById: salima.id,
              createdAt: ago(60),
            });
            correctiveActionId = ca.id;
          }
          responses.push({
            auditId: audit1.id,
            itemId: items[i].id,
            result: results[i],
            comment: results[i] === AuditResult.NON_CONFORM ? 'Écart constaté lors de la visite, preuve insuffisante.' : null,
            correctiveActionId,
          });
        }
        await save(AuditResponse, responses);
        const summary = summarizeResponses(results, items.length);
        await em.getRepository(Audit).update(audit1.id, { score: summary.score });
      }
      const pdf1 = makePdf('Rapport d audit interne ISO 45001');
      const pdf2 = makePdf('Politique SST de l entreprise');
      writeFileSync(join(uploadsDir, 'seed-rapport-audit-interne.pdf'), pdf1);
      writeFileSync(join(uploadsDir, 'seed-politique-sst.pdf'), pdf2);
      const f1 = await one(StoredFile, { path: 'seed-rapport-audit-interne.pdf', originalName: 'rapport-audit-interne-iso45001.pdf', mimeType: 'application/pdf', size: pdf1.length, uploadedById: salima.id });
      const f2 = await one(StoredFile, { path: 'seed-politique-sst.pdf', originalName: 'politique-sst.pdf', mimeType: 'application/pdf', size: pdf2.length, uploadedById: admin.id });
      await save(ComplianceDocument, [
        { title: 'Rapport d’audit interne ISO 45001', type: ComplianceDocumentType.AUDIT_REPORT, fileId: f1.id, validUntil: dateOnly(ahead(300)), auditId: audit1.id, uploadedById: salima.id },
        { title: 'Politique SST de l’entreprise', type: ComplianceDocumentType.POLICY, fileId: f2.id, validUntil: dateOnly(ahead(20)), auditId: null, uploadedById: admin.id },
      ]);

      // ---------------------------------------------------------- drills (no active emergency event)
      const scenarios = await em.getRepository(EmergencyScenario).find({ order: { id: 'ASC' } });
      const evac = scenarios.find((s) => s.title.startsWith('Évacuation')) ?? scenarios[0];
      const fire = scenarios.find((s) => s.title === 'Incendie') ?? scenarios[0];
      await save(Drill, [
        { scenarioId: evac?.id ?? null, scheduledAt: ago(75, 10), zone: 'Atelier A', status: DrillStatus.DONE, durationSeconds: 412, participantsCount: 34, evacuatedCount: 34, observations: 'Évacuation complète en moins de 7 minutes. Point de rassemblement respecté ; une issue de secours encombrée à dégager.', createdById: salima.id },
        { scenarioId: fire?.id ?? null, scheduledAt: ahead(25, 10), zone: 'Entrepôt', status: DrillStatus.PLANNED, createdById: salima.id },
      ]);

      // ---------------------------------------------------------- other alerts
      alertRows.push(
        { title: 'Stock bas : gants anti-coupure', description: 'Quantité 12 sous le seuil minimal (20).', severity: AlertSeverity.MEDIUM, status: AlertStatus.UNRESOLVED, type: AlertType.STOCK, metadata: { itemId: item('Gants anti-coupure').id }, created_at: ago(3) } as any,
        { title: 'Maintenance en retard : détecteur de gaz fixe', description: 'Contrôle semestriel dépassé de 10 jours.', severity: AlertSeverity.HIGH, status: AlertStatus.INVESTIGATING, type: AlertType.MAINTENANCE, metadata: { itemId: item('Détecteur de gaz fixe').id }, created_at: ago(10) } as any,
        { title: 'Certifications de formation bientôt expirées', description: 'Plusieurs certificats expirent dans les 30 prochains jours.', severity: AlertSeverity.MEDIUM, status: AlertStatus.UNRESOLVED, type: AlertType.TRAINING, created_at: ago(1) } as any,
        { title: 'Risque critique validé : incendie de l’armoire électrique', description: 'Score 20/25.', severity: AlertSeverity.CRITICAL, status: AlertStatus.RESOLVED, type: AlertType.RISK, metadata: { riskId: risks[2].id }, resolved_by_id: salima.id, resolved_at: ago(250), created_at: ago(260) } as any,
      );
      await save(Alert, alertRows as any);

      // ---------------------------------------------------------- messaging, announcements, feedback, notifications
      const conv = await one(Conversation, { subject: 'Extincteur CO2 de l’atelier B', createdById: karim.id, createdAt: ago(6, 9), updatedAt: ago(5, 15) });
      const msgs: [User, string, number, number][] = [
        [karim, 'Bonjour Mme Ouali, l’extincteur CO2 de l’atelier B semble endommagé (buse cassée). Pouvez-vous le faire vérifier ?', 6, 9],
        [salima, 'Bonjour Karim, merci pour l’alerte. Une maintenance corrective est planifiée, l’extincteur est marqué non fonctionnel.', 6, 11],
        [karim, 'Merci. En attendant, puis-je utiliser celui de l’atelier A ?', 5, 8],
        [salima, 'Oui, un extincteur de remplacement sera installé dès aujourd’hui à côté de l’armoire électrique.', 5, 15],
      ];
      await save(ConversationParticipant, [
        { conversationId: conv.id, userId: karim.id, lastReadAt: ago(5, 16) },
        { conversationId: conv.id, userId: salima.id, lastReadAt: ago(5, 15) },
      ]);
      await save(
        ConversationMessage,
        msgs.map(([u, body, d, h]) => ({ conversationId: conv.id, senderId: u.id, body, createdAt: ago(d, h) })),
      );
      const everyone = [...managers, ...employees];
      const announce = (subject: string, content: string, daysAgo: number, urgent: boolean) =>
        everyone.map((u, i) => ({
          subject,
          content,
          system_sender: 'Direction SST',
          recipient_id: u.id,
          status: i % 3 === 0 ? MessageStatus.READ : MessageStatus.UNREAD,
          is_urgent: urgent,
          created_at: ago(daysAgo, 8),
        }));
      await save(Message, [
        ...announce('Exercice d’évacuation planifié', `Un exercice d’évacuation incendie aura lieu dans l’entrepôt le ${ahead(25).toLocaleDateString('fr-FR')}. La participation est obligatoire.`, 4, false),
        ...announce('Port des EPI obligatoire en atelier', 'Rappel : casque, lunettes et chaussures de sécurité sont obligatoires dans les ateliers A et B, sans exception.', 14, true),
      ] as any);
      await save(Feedback, [
        { userId: karim.id, rating: 5, category: FeedbackCategory.SUGGESTION, comment: 'Très pratique pour signaler rapidement un incident avec photo.', appVersion: '1.0.0', platform: 'android', createdAt: ago(20) },
        { userId: amina.id, rating: 4, category: FeedbackCategory.USABILITY, comment: 'Les boutons pourraient être plus grands avec des gants.', appVersion: '1.0.0', platform: 'android', createdAt: ago(15) },
        { userId: sofiane.id, rating: 3, category: FeedbackCategory.BUG, comment: 'La localisation GPS met du temps dans l’entrepôt.', appVersion: '1.0.0', platform: 'ios', createdAt: ago(9) },
        { userId: nadia.id, rating: 5, category: FeedbackCategory.OTHER, comment: 'Application claire, merci.', appVersion: '1.0.0', platform: 'android', createdAt: ago(3) },
      ]);
      const notif = (u: User, type: NotificationType, title: string, body: string, d: number, read: boolean) => ({
        userId: u.id,
        type,
        title,
        body,
        data: null,
        readAt: read ? ago(d - 0.2) : null,
        createdAt: ago(d),
      });
      await save(Notification, [
        notif(salima, NotificationType.INCIDENT, 'Nouvel incident critique', savedIncidents[39].incidentId + ' : ' + savedIncidents[39].description.slice(0, 80), 0.1, false),
        notif(mourad, NotificationType.INCIDENT, 'Nouvel incident critique', savedIncidents[39].incidentId + ' : ' + savedIncidents[39].description.slice(0, 80), 0.1, false),
        notif(salima, NotificationType.INVENTORY, 'Stock bas', 'Gants anti-coupure niveau 5 : 12 en stock (minimum 20).', 3, false),
        notif(salima, NotificationType.MAINTENANCE, 'Maintenance en retard', 'Détecteur de gaz fixe : contrôle semestriel dépassé.', 10, true),
        notif(salima, NotificationType.AUDIT, 'Audit externe planifié', 'Audit de certification ISO 45001 dans 30 jours.', 7, true),
        notif(karim, NotificationType.TRAINING, 'Certification bientôt expirée', 'Votre certificat Sécurité incendie expire dans moins de 30 jours.', 2, false),
        notif(amina, NotificationType.TRAINING, 'Certification bientôt expirée', 'Votre certificat Port des EPI expire dans moins de 30 jours.', 2, false),
        notif(nadia, NotificationType.TRAINING, 'Inscription confirmée', 'Vous êtes inscrite à la session Sécurité incendie.', 5, true),
        notif(karim, NotificationType.MESSAGE, 'Nouveau message', 'Salima Ouali a répondu à votre conversation.', 5, true),
        notif(karim, NotificationType.INCIDENT, 'Statut de votre incident mis à jour', `${savedIncidents[0].incidentId}: investigating -> resolved`, 20, true),
        notif(sofiane, NotificationType.SYSTEM, 'Bienvenue sur PROSAFE', 'Signalez les incidents et gagnez des points de prévention.', 30, true),
        notif(admin, NotificationType.ALERT, 'Alertes actives', '4 alertes non résolues à examiner.', 1, false),
      ]);
    });

    // ---------------------------------------------------------- summary
    console.log('\nPROSAFE demo seed complete.');
    console.log(`Password for all accounts: ${DEMO_PASSWORD}`);
    console.log('Accounts: admin@prosafe.demo, salima.ouali@prosafe.demo, mourad.kaci@prosafe.demo (sst_manager), karim.benali / amina.boudiaf / yacine.messaoudi / sofiane.hamdi / nadia.cherif / rachid.taleb @prosafe.demo (employee)');
    console.log('Created rows:');
    for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(22)} ${v}`);
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err?.message ?? err);
  process.exit(1);
});
