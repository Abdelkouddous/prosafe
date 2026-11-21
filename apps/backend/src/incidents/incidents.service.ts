import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, SelectQueryBuilder } from 'typeorm';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { Incident } from './entities/incident.entity';
import { IncidentMedia, IncidentMediaKind } from './entities/incident-media.entity';
import { IncidentHistory } from './entities/incident-history.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';
import { IncidentStatus } from './enums/incident-status.enum';
import { IncidentSeverity } from './enums/incident-severity.enum';
import { RewardsService } from '../rewards/rewards.service';
import { FilesService } from '../files/files.service';
import { StoredFile } from '../files/entities/stored-file.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { MANAGER_ROLES } from '../users/enums/role.enum';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/enums/alert-severity.enum';
import { AlertType } from '../alerts/enums/alert-type.enum';
import { CorrectiveActionsService } from '../corrective-actions/corrective-actions.service';
import { CorrectiveActionSource } from '../corrective-actions/enums/corrective-action.enums';
import { EvaluateIncidentDto } from './dto/evaluate-incident.dto';

export interface IncidentScope {
  /** Id of the requesting user */
  userId: number;
  /** admin / sst_manager: may see every incident */
  isManager: boolean;
}

export const MAX_MEDIA = 5;

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    private readonly rewardsService: RewardsService,
    private readonly filesService: FilesService,
    private readonly notificationsService: NotificationsService,
    private readonly correctiveActions: CorrectiveActionsService,
    private readonly alertsService: AlertsService,
  ) {}

  async create(
    dto: CreateIncidentDto,
    files: Express.Multer.File[],
    userId: number,
  ): Promise<{ incidentId: string; id: number; reward?: { pointsAwarded: number; totalPoints: number } }> {
    const uploaded = files ?? [];
    const stored: StoredFile[] = [];
    try {
      if (uploaded.length > MAX_MEDIA) throw new BadRequestException(`At most ${MAX_MEDIA} media files are allowed`);

      const location = this.resolveLocation(dto);
      const incidentId = this.generateIncidentId();
      const timestamp = dto.date instanceof Date && !isNaN(dto.date.getTime()) ? dto.date : new Date();

      // Duplicate detection uses the first image
      const firstImage = uploaded.find((f) => f.mimetype?.startsWith('image/'));
      const photoHash = firstImage ? await this.hashFile(firstImage) : null;
      if (photoHash) await this.checkDuplicates(photoHash, location, timestamp, userId);

      for (const f of uploaded) stored.push(await this.filesService.saveUploaded(f, { id: userId }));

      const saved = await this.incidentRepository.manager.transaction(async (em) => {
        const incident = await em.save(
          em.create(Incident, {
            incidentId,
            photoHash,
            description: dto.description,
            notes: dto.notes ?? null,
            zone: dto.zone ?? null,
            department: dto.department ?? null,
            type: dto.type,
            severity: dto.severity,
            timestamp,
            reportedBy: userId,
            status: IncidentStatus.OPEN,
            geoLatitude: location.lat,
            geoLongitude: location.long,
            manualAddress: location.manualAddress,
          }),
        );
        for (const file of stored) {
          await em.save(
            em.create(IncidentMedia, {
              incidentRefId: incident.id,
              fileId: file.id,
              kind: file.mimeType.startsWith('video/') ? IncidentMediaKind.VIDEO : IncidentMediaKind.IMAGE,
            }),
          );
        }
        await em.save(
          em.create(IncidentHistory, {
            incidentRefId: incident.id,
            fromStatus: null,
            toStatus: IncidentStatus.OPEN,
            comment: null,
            changedById: userId,
          }),
        );
        return incident;
      });

      const reward = await this.rewardsService.awardForIncident(userId, incidentId, {
        severity: dto.severity,
        hasPhoto: stored.length > 0,
        hasLocation: location.lat !== undefined || !!location.manualAddress,
      });

      const urgent = dto.severity === IncidentSeverity.CRITICAL || dto.severity === IncidentSeverity.HIGH;
      await this.notificationsService.notifyRoles(MANAGER_ROLES, {
        type: NotificationType.INCIDENT,
        title: urgent ? `Incident ${dto.severity}` : 'Nouvel incident',
        body: `${dto.type}: ${dto.description ?? incidentId}`.slice(0, 200),
        data: { incidentId, id: saved.id, severity: dto.severity },
        priority: urgent ? 'high' : 'normal',
      });

      if (dto.severity === IncidentSeverity.CRITICAL) await this.raiseCriticalAlert(saved.id, incidentId, dto);

      return { incidentId, id: saved.id, reward };
    } catch (err) {
      // Nothing must stay behind when the creation fails
      await this.filesService.discard(uploaded, stored);
      throw err;
    }
  }

  /** Creates an `alert` row (never fails the incident creation). */
  private async raiseCriticalAlert(id: number, incidentId: string, dto: CreateIncidentDto): Promise<void> {
    try {
      await this.alertsService.create({
        title: `Incident critique ${incidentId}`,
        description: `${dto.type}: ${dto.description ?? incidentId}`.slice(0, 500),
        severity: AlertSeverity.CRITICAL,
        type: AlertType.CRITICAL_INCIDENT,
        metadata: { incidentId, id, zone: dto.zone ?? null, department: dto.department ?? null },
      });
    } catch (err) {
      this.logger.error(`critical alert for ${incidentId} failed: ${(err as Error).message}`);
    }
  }

  async updateStatus(idOrCode: string, dto: UpdateIncidentStatusDto, userId: number): Promise<Incident> {
    if (dto.rejected && dto.status !== IncidentStatus.CLOSED) {
      throw new BadRequestException('`rejected` is only allowed with status `closed`');
    }
    const incident = await this.incidentRepository.findOne({ where: this.idWhere(idOrCode) });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const previous = incident.status;
    this.validateStatusTransition(previous, dto.status);

    incident.status = dto.status;
    if (dto.status === IncidentStatus.RESOLVED || dto.status === IncidentStatus.CLOSED) {
      incident.resolvedAt = new Date();
      incident.resolvedBy = userId;
    } else {
      // Re-opened / under investigation: no longer resolved
      incident.resolvedAt = null;
      incident.resolvedBy = null;
    }

    const comment = dto.comment ?? dto.notes ?? null;
    const saved = await this.incidentRepository.manager.transaction(async (em) => {
      const s = await em.save(incident);
      await em.save(
        em.create(IncidentHistory, {
          incidentRefId: incident.id,
          fromStatus: previous,
          toStatus: dto.status,
          comment,
          changedById: userId,
        }),
      );
      return s;
    });

    let pointsRevoked = 0;
    if (dto.rejected) pointsRevoked = await this.rewardsService.revokeForIncident(incident.incidentId);

    await this.notificationsService.notifyUsers([incident.reportedBy], {
      type: NotificationType.INCIDENT,
      title: dto.rejected ? 'Votre incident a été rejeté' : 'Statut de votre incident mis à jour',
      body: `${incident.incidentId}: ${previous} -> ${dto.status}`,
      data: { incidentId: incident.incidentId, id: incident.id, status: dto.status, rejected: !!dto.rejected, pointsRevoked },
    });

    return saved;
  }

  /** Paginated list. Employees are always restricted to their own incidents. */
  async findAll(query: ListIncidentsQueryDto, scope: IncidentScope) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.listQuery(query, scope);
    qb.orderBy('i.createdAt', 'DESC').addOrderBy('i.id', 'DESC').skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map((r) => this.present(r)), total, page, limit };
  }

  /** Unpaginated list kept for the legacy /admin/incidents endpoint and KPI counts. */
  async findAllUnpaged(query: Partial<ListIncidentsQueryDto> = {}): Promise<any[]> {
    const rows = await this.listQuery(query as ListIncidentsQueryDto, { userId: 0, isManager: true })
      .orderBy('i.createdAt', 'DESC')
      .getMany();
    return rows.map((r) => this.present(r));
  }

  async count(): Promise<number> {
    return this.incidentRepository.count();
  }

  async findOne(idOrCode: string, scope?: IncidentScope) {
    const qb = this.baseQuery()
      .leftJoin('i.resolver', 'resolver')
      .addSelect(['resolver.id', 'resolver.firstName', 'resolver.lastName'])
      .leftJoin('i.evaluatedBy', 'evaluator')
      .addSelect(['evaluator.id', 'evaluator.firstName', 'evaluator.lastName'])
      .leftJoin('i.history', 'h')
      .addSelect(['h.id', 'h.fromStatus', 'h.toStatus', 'h.comment', 'h.changedAt', 'h.changedById'])
      .leftJoin('h.changedBy', 'hu')
      .addSelect(['hu.id', 'hu.firstName', 'hu.lastName'])
      .orderBy('h.changedAt', 'ASC')
      .addOrderBy('h.id', 'ASC');
    const where = this.idWhere(idOrCode);
    if ('id' in where) qb.where('i.id = :id', { id: where.id });
    else qb.where('i.incidentId = :code', { code: where.incidentId });

    const incident = await qb.getOne();
    // Employees may only see their own incidents (404 rather than 403 to avoid leaking existence)
    if (!incident || (scope && !scope.isManager && incident.reportedBy !== scope.userId)) {
      throw new NotFoundException('Incident not found');
    }
    const correctiveActions = await this.correctiveActions.findBySource(CorrectiveActionSource.INCIDENT, incident.id);
    return { ...this.present(incident), evaluation: this.presentEvaluation(incident), correctiveActions };
  }

  /** Manager evaluation (A4): riskScore = gravity * probability. Returns the full incident detail. */
  async evaluate(idOrCode: string, dto: EvaluateIncidentDto, userId: number) {
    const incident = await this.incidentRepository.findOne({ where: this.idWhere(idOrCode) });
    if (!incident) throw new NotFoundException('Incident not found');
    incident.gravity = dto.gravity;
    incident.probability = dto.probability;
    incident.riskScore = dto.gravity * dto.probability;
    if (dto.rootCause !== undefined) incident.rootCause = dto.rootCause;
    if (dto.evaluatedSeverity !== undefined) incident.evaluatedSeverity = dto.evaluatedSeverity;
    incident.evaluatedById = userId;
    incident.evaluatedAt = new Date();
    await this.incidentRepository.save(incident);
    return this.findOne(String(incident.id));
  }

  private presentEvaluation(i: Incident) {
    if (!i.evaluatedAt) return null;
    const by = (i as any).evaluatedBy;
    return {
      gravity: i.gravity,
      probability: i.probability,
      riskScore: i.riskScore,
      rootCause: i.rootCause,
      evaluatedSeverity: i.evaluatedSeverity,
      evaluatedAt: i.evaluatedAt,
      evaluatedBy: by ? { id: by.id, firstName: by.firstName, lastName: by.lastName } : null,
    };
  }

  /** The 10 latest incidents of the user (legacy mobile endpoint). */
  async findMyIncidents(userId: number) {
    const { data } = await this.findAll({ page: 1, limit: 10 }, { userId, isManager: false });
    return data;
  }

  // ---------- query helpers ----------

  /** Incident + reporter {id, firstName, lastName} + media [{file.id, file.mimeType, kind}] (never any file content). */
  private baseQuery(): SelectQueryBuilder<Incident> {
    return this.incidentRepository
      .createQueryBuilder('i')
      .leftJoin('i.reporter', 'reporter')
      .addSelect(['reporter.id', 'reporter.firstName', 'reporter.lastName'])
      .leftJoin('i.media', 'm')
      .addSelect(['m.id', 'm.kind'])
      .leftJoin('m.file', 'f')
      .addSelect(['f.id', 'f.mimeType']);
  }

  private listQuery(q: Partial<ListIncidentsQueryDto>, scope: IncidentScope): SelectQueryBuilder<Incident> {
    const qb = this.baseQuery();

    if (!scope.isManager) qb.andWhere('i.reportedBy = :me', { me: scope.userId });
    else if (q.reporterId !== undefined) qb.andWhere('i.reportedBy = :rid', { rid: q.reporterId });

    if (q.status) qb.andWhere('i.status = :status', { status: q.status });
    if (q.type) qb.andWhere('i.type = :type', { type: q.type });
    if (q.severity) qb.andWhere('i.severity = :severity', { severity: q.severity });
    if (q.zone) qb.andWhere('i.zone = :zone', { zone: q.zone });
    if (q.department) qb.andWhere('i.department = :department', { department: q.department });

    if (q.from) qb.andWhere('i.timestamp >= :from', { from: new Date(q.from) });
    if (q.to) {
      const to = new Date(q.to);
      // date-only value (YYYY-MM-DD): include the whole day
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.to)) {
        to.setUTCDate(to.getUTCDate() + 1);
        qb.andWhere('i.timestamp < :to', { to });
      } else {
        qb.andWhere('i.timestamp <= :to', { to });
      }
    }

    if (q.search) {
      qb.andWhere('(i.description ILIKE :s OR i.manualAddress ILIKE :s OR i.incidentId ILIKE :s)', {
        s: `%${q.search.replace(/[%_\\]/g, '\\$&')}%`,
      });
    }

    const geo = [q.lat, q.lng, q.radiusKm].filter((v) => v !== undefined).length;
    if (geo > 0) {
      if (geo !== 3) throw new BadRequestException('lat, lng and radiusKm must be provided together');
      // Bounding box (index friendly) then exact haversine distance
      const dLat = q.radiusKm / 111.32;
      const dLng = q.radiusKm / (111.32 * Math.max(Math.cos((q.lat * Math.PI) / 180), 0.01));
      qb.andWhere('i."geoLatitude" BETWEEN :minLat AND :maxLat', { minLat: q.lat - dLat, maxLat: q.lat + dLat });
      qb.andWhere('i."geoLongitude" BETWEEN :minLng AND :maxLng', { minLng: q.lng - dLng, maxLng: q.lng + dLng });
      qb.andWhere(
        `(2 * 6371 * asin(sqrt(
          power(sin(radians(i."geoLatitude"::float - CAST(:lat AS float)) / 2), 2) +
          cos(radians(CAST(:lat AS float))) * cos(radians(i."geoLatitude"::float)) * power(sin(radians(i."geoLongitude"::float - CAST(:lng AS float)) / 2), 2)
        ))) <= CAST(:radius AS float)`,
        { lat: q.lat, lng: q.lng, radius: q.radiusKm },
      );
    }
    return qb;
  }

  /** Response shape: media => [{ id (stored file id), kind, mimeType }]; decimals as numbers. */
  private present(incident: Incident): any {
    const { media, ...rest } = incident as any;
    return {
      ...rest,
      geoLatitude: rest.geoLatitude === null || rest.geoLatitude === undefined ? null : Number(rest.geoLatitude),
      geoLongitude: rest.geoLongitude === null || rest.geoLongitude === undefined ? null : Number(rest.geoLongitude),
      media: (media ?? []).map((m: IncidentMedia) => ({ id: m.file?.id ?? m.fileId, kind: m.kind, mimeType: m.file?.mimeType })),
    };
  }

  private idWhere(idOrCode: string): { id: number } | { incidentId: string } {
    return /^\d+$/.test(idOrCode) ? { id: parseInt(idOrCode, 10) } : { incidentId: idOrCode };
  }

  // ---------- validation helpers ----------

  /** Normalises flat (multipart) and legacy nested location input. */
  private resolveLocation(dto: CreateIncidentDto): { lat?: number; long?: number; manualAddress?: string } {
    const lat = dto.latitude ?? dto.location?.lat;
    const long = dto.longitude ?? dto.location?.long;
    const manualAddress = (dto.manualAddress ?? dto.location?.manualAddress)?.trim() || undefined;
    const hasGeo = lat !== undefined && long !== undefined;
    if (!hasGeo && !manualAddress) {
      throw new BadRequestException('Either geo coordinates or manual address is required');
    }
    return { lat: hasGeo ? lat : undefined, long: hasGeo ? long : undefined, manualAddress };
  }

  private async hashFile(file: Express.Multer.File): Promise<string> {
    const content = file.buffer ?? (await readFile(file.path));
    return createHash('sha256').update(content).digest('hex');
  }

  private generateIncidentId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < 6; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `INC-${date}-${randomString}`;
  }

  private async checkDuplicates(photoHash: string, location: { lat?: number; long?: number }, timestamp: Date, userId: number): Promise<void> {
    const existingByPhoto = await this.incidentRepository.findOne({
      where: { photoHash, reportedBy: userId },
    });

    if (existingByPhoto) {
      throw new ConflictException(`Duplicate photo detected. Existing incident: ${existingByPhoto.incidentId}`);
    }

    // Same place within 30 minutes
    if (location.lat !== undefined && location.long !== undefined) {
      const timeWindow = 30 * 60 * 1000;
      const existingByLocation = await this.incidentRepository.findOne({
        where: {
          reportedBy: userId,
          geoLatitude: Between(location.lat - 0.001, location.lat + 0.001),
          geoLongitude: Between(location.long - 0.001, location.long + 0.001),
          timestamp: Between(new Date(timestamp.getTime() - timeWindow), new Date(timestamp.getTime() + timeWindow)),
        },
      });

      if (existingByLocation) {
        throw new ConflictException(
          `Similar incident reported recently at this location. Existing incident: ${existingByLocation.incidentId}`,
        );
      }
    }
  }

  private validateStatusTransition(currentStatus: IncidentStatus, newStatus: IncidentStatus): void {
    const validTransitions = {
      // `closed` also covers "rejected" (docs/API_CONTRACT.md), hence reachable from open / investigating
      [IncidentStatus.OPEN]: [IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
      [IncidentStatus.INVESTIGATING]: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
      [IncidentStatus.RESOLVED]: [IncidentStatus.INVESTIGATING, IncidentStatus.CLOSED],
      [IncidentStatus.CLOSED]: [],
    };

    if (!(validTransitions[currentStatus] ?? []).includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}
