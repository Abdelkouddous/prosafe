import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Training } from './entities/training.entity';
import { TrainingSession } from './entities/training-session.entity';
import { Enrollment } from './entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { MANAGER_ROLES, Role } from '../users/enums/role.enum';
import { EnrollmentStatus, EXPIRES_SOON_DAYS, SessionStatus } from './enums/training.enums';
import {
  AutoPlanDto,
  CreateSessionDto,
  CreateTrainingDto,
  ListSessionsQueryDto,
  ListTrainingsQueryDto,
  MyTrainingsQueryDto,
  PaginationDto,
  UpdateEnrollmentDto,
  UpdateSessionDto,
  UpdateTrainingDto,
} from './dto/trainings.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';

const DAY = 86_400_000;
const isManager = (u: { roles?: Role[] }) => MANAGER_ROLES.some((r) => u.roles?.includes(r));

export interface SkillTraining {
  trainingId: number;
  title: string;
  completedAt?: Date | null;
  expiresAt?: Date | null;
  expired?: boolean;
}
export interface UserSkills {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  department: string | null;
  acquired: SkillTraining[];
  expiring: SkillTraining[];
  missing: SkillTraining[];
}

@Injectable()
export class TrainingsService {
  private readonly logger = new Logger(TrainingsService.name);

  constructor(
    @InjectRepository(Training) private readonly trainingRepo: Repository<Training>,
    @InjectRepository(TrainingSession) private readonly sessionRepo: Repository<TrainingSession>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------- Trainings catalogue ----------

  async listTrainings(q: ListTrainingsQueryDto, actor: { roles?: Role[] }) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.trainingRepo.createQueryBuilder('t').orderBy('t.title', 'ASC').addOrderBy('t.id', 'ASC');
    // employees only see active trainings
    const isActive = isManager(actor) ? q.isActive : true;
    if (isActive !== undefined) qb.andWhere('t.isActive = :isActive', { isActive });
    if (q.category) qb.andWhere('t.category = :category', { category: q.category });
    if (q.search?.trim()) {
      qb.andWhere('(t.title ILIKE :term OR t.description ILIKE :term)', { term: `%${q.search.trim().replace(/[%_\\]/g, '\\$&')}%` });
    }
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findTraining(id: number, actor?: { roles?: Role[] }): Promise<Training> {
    const t = await this.trainingRepo.findOne({ where: { id } });
    if (!t || (actor && !isManager(actor) && !t.isActive)) throw new NotFoundException('Training not found');
    return t;
  }

  createTraining(dto: CreateTrainingDto): Promise<Training> {
    return this.trainingRepo.save(
      this.trainingRepo.create({
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category ?? null,
        durationHours: dto.durationHours ?? null,
        validityMonths: dto.validityMonths ?? null,
        mandatoryForRoles: dto.mandatoryForRoles ?? [],
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async updateTraining(id: number, dto: UpdateTrainingDto): Promise<Training> {
    const t = await this.findTraining(id);
    Object.assign(t, dto);
    return this.trainingRepo.save(t);
  }

  async removeTraining(id: number): Promise<void> {
    const t = await this.findTraining(id);
    const used = await this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoin('e.session', 's')
      .where('s.trainingId = :id', { id })
      .getCount();
    if (used > 0) throw new ConflictException('Training has enrollments; deactivate it (isActive=false) instead');
    await this.trainingRepo.remove(t);
  }

  // ---------- Sessions ----------

  private async withCounts<T extends TrainingSession>(sessions: T[]): Promise<T[]> {
    if (!sessions.length) return sessions;
    const rows: { sessionId: number; count: string }[] = await this.enrollmentRepo
      .createQueryBuilder('e')
      .select('e.sessionId', 'sessionId')
      .addSelect('COUNT(*)', 'count')
      .where('e.sessionId IN (:...ids)', { ids: sessions.map((s) => s.id) })
      .andWhere('e.status != :cancelled', { cancelled: EnrollmentStatus.CANCELLED })
      .groupBy('e.sessionId')
      .getRawMany();
    const map = new Map(rows.map((r) => [Number(r.sessionId), Number(r.count)]));
    sessions.forEach((s) => (s.enrolledCount = map.get(s.id) ?? 0));
    return sessions;
  }

  private sessionQuery() {
    return this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.training', 't')
      .addSelect(['t.id', 't.title', 't.category', 't.durationHours', 't.validityMonths']);
  }

  async listSessions(q: ListSessionsQueryDto, userId?: number) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.sessionQuery();
    if (q.trainingId) qb.andWhere('s.trainingId = :tid', { tid: q.trainingId });
    if (q.status) qb.andWhere('s.status = :status', { status: q.status });
    if (q.from) qb.andWhere('s.startAt >= :from', { from: new Date(q.from) });
    if (q.to) {
      const to = new Date(q.to);
      if (/^\d{4}-\d{2}-\d{2}$/.test(q.to)) to.setUTCHours(23, 59, 59, 999);
      qb.andWhere('s.startAt <= :to', { to });
    }
    if (q.upcoming) qb.andWhere('s.startAt >= :now AND s.status != :cancelled', { now: new Date(), cancelled: SessionStatus.CANCELLED });
    qb.orderBy('s.startAt', 'ASC').addOrderBy('s.id', 'ASC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    await this.withCounts(data);
    let mine = new Set<number>();
    if (userId && data.length) {
      const mineRows = await this.enrollmentRepo.find({
        where: { userId, sessionId: In(data.map((s) => s.id)), status: Not(EnrollmentStatus.CANCELLED) },
        select: ['id', 'sessionId'],
      });
      mine = new Set(mineRows.map((e) => e.sessionId));
    }
    return { data: data.map((s) => ({ ...s, enrolledByMe: mine.has(s.id) })), total, page, limit };
  }

  async findSession(id: number): Promise<TrainingSession> {
    const s = await this.sessionQuery().where('s.id = :id', { id }).getOne();
    if (!s) throw new NotFoundException('Session not found');
    await this.withCounts([s]);
    return s;
  }

  private checkDates(startAt: Date, endAt?: Date | null) {
    if (endAt && endAt < startAt) throw new BadRequestException('endAt must not be before startAt');
  }

  async createSession(dto: CreateSessionDto): Promise<TrainingSession> {
    const training = await this.trainingRepo.findOne({ where: { id: dto.trainingId }, select: ['id'] });
    if (!training) throw new NotFoundException('Training not found');
    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    this.checkDates(startAt, endAt);
    const saved = await this.sessionRepo.save(
      this.sessionRepo.create({
        trainingId: dto.trainingId,
        startAt,
        endAt,
        location: dto.location ?? null,
        trainer: dto.trainer ?? null,
        capacity: dto.capacity ?? null,
        status: dto.status ?? SessionStatus.PLANNED,
      }),
    );
    return this.findSession(saved.id);
  }

  async updateSession(id: number, dto: UpdateSessionDto): Promise<TrainingSession> {
    const s = await this.sessionRepo.findOne({ where: { id }, relations: { training: true } });
    if (!s) throw new NotFoundException('Session not found');
    const previousStatus = s.status;
    const previousStart = s.startAt.getTime();
    if (dto.startAt) s.startAt = new Date(dto.startAt);
    if (dto.endAt) s.endAt = new Date(dto.endAt);
    this.checkDates(s.startAt, s.endAt);
    if (dto.location !== undefined) s.location = dto.location;
    if (dto.trainer !== undefined) s.trainer = dto.trainer;
    if (dto.status) s.status = dto.status;
    if (dto.capacity !== undefined) {
      const count = await this.enrollmentRepo.count({ where: { sessionId: id, status: Not(EnrollmentStatus.CANCELLED) } });
      if (dto.capacity < count) throw new ConflictException(`Capacity cannot be lower than the ${count} current enrollment(s)`);
      s.capacity = dto.capacity;
    }
    await this.sessionRepo.save(s);

    const cancelled = s.status === SessionStatus.CANCELLED && previousStatus !== SessionStatus.CANCELLED;
    const moved = !cancelled && s.status !== SessionStatus.CANCELLED && s.startAt.getTime() !== previousStart;
    if (cancelled || moved) {
      const enrolled = await this.enrollmentRepo.find({ where: { sessionId: id, status: EnrollmentStatus.REGISTERED }, select: ['id', 'userId'] });
      await this.notifications.notifyUsers(
        enrolled.map((e) => e.userId),
        {
          type: NotificationType.TRAINING,
          title: cancelled ? 'Session de formation annulee' : 'Session de formation reprogrammee',
          body: cancelled
            ? `La session "${s.training?.title}" est annulee.`
            : `La session "${s.training?.title}" est reprogrammee au ${s.startAt.toISOString().slice(0, 16).replace('T', ' ')} UTC.`,
          data: { key: `session-change:${id}:${Date.now()}`, sessionId: id, trainingId: s.trainingId },
        },
      );
    }
    return this.findSession(id);
  }

  async removeSession(id: number): Promise<void> {
    const s = await this.sessionRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Session not found');
    const count = await this.enrollmentRepo.count({ where: { sessionId: id } });
    if (count > 0) throw new ConflictException('Session has enrollments; cancel it (status=cancelled) instead');
    await this.sessionRepo.remove(s);
  }

  // ---------- Enrollments ----------

  async enroll(sessionId: number, actor: { id: number; roles?: Role[] }, targetUserId?: number): Promise<Enrollment> {
    const userId = targetUserId ?? actor.id;
    if (userId !== actor.id && !isManager(actor)) throw new ForbiddenException('Only managers can enroll other users');

    return this.dataSource.transaction(async (em) => {
      // row lock serialises concurrent enrollments so capacity cannot be exceeded
      const session = await em.findOne(TrainingSession, { where: { id: sessionId }, lock: { mode: 'pessimistic_write' } });
      if (!session) throw new NotFoundException('Session not found');
      if (session.status === SessionStatus.CANCELLED || session.status === SessionStatus.COMPLETED) {
        throw new BadRequestException(`Cannot enroll in a ${session.status} session`);
      }
      if (session.startAt.getTime() < Date.now()) throw new BadRequestException('Cannot enroll in a session that already started');
      if (userId !== actor.id) {
        const exists = await em.findOne(User, { where: { id: userId }, select: ['id'] });
        if (!exists) throw new NotFoundException('User not found');
      }
      const existing = await em.findOne(Enrollment, { where: { sessionId, userId } });
      if (existing && existing.status !== EnrollmentStatus.CANCELLED) throw new ConflictException('Already enrolled in this session');

      const count = await em.count(Enrollment, { where: { sessionId, status: Not(EnrollmentStatus.CANCELLED) } });
      if (session.capacity != null && count >= session.capacity) throw new ConflictException('Session is full');

      if (existing) {
        existing.status = EnrollmentStatus.REGISTERED;
        existing.progress = 0;
        existing.score = null;
        existing.completedAt = null;
        existing.expiresAt = null;
        return em.save(Enrollment, existing);
      }
      return em.save(Enrollment, em.create(Enrollment, { sessionId, userId, status: EnrollmentStatus.REGISTERED, progress: 0 }));
    });
  }

  async unenroll(sessionId: number, actor: { id: number; roles?: Role[] }, targetUserId?: number): Promise<Enrollment> {
    const userId = targetUserId ?? actor.id;
    if (userId !== actor.id && !isManager(actor)) throw new ForbiddenException('Only managers can cancel other users enrollments');
    const e = await this.enrollmentRepo.findOne({ where: { sessionId, userId } });
    if (!e || e.status === EnrollmentStatus.CANCELLED) throw new NotFoundException('Enrollment not found');
    if (e.status !== EnrollmentStatus.REGISTERED) throw new BadRequestException(`Cannot cancel an enrollment that is ${e.status}`);
    e.status = EnrollmentStatus.CANCELLED;
    return this.enrollmentRepo.save(e);
  }

  async listSessionEnrollments(sessionId: number, q: PaginationDto) {
    const exists = await this.sessionRepo.count({ where: { id: sessionId } });
    if (!exists) throw new NotFoundException('Session not found');
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const [data, total] = await this.enrollmentRepo
      .createQueryBuilder('e')
      .leftJoin('e.user', 'u')
      .addSelect(['u.id', 'u.firstName', 'u.lastName', 'u.department'])
      .where('e.sessionId = :sessionId', { sessionId })
      .orderBy('e.createdAt', 'ASC')
      .addOrderBy('e.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  private addMonths(from: Date, months: number): Date {
    const d = new Date(from);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
  }

  async updateEnrollment(id: number, dto: UpdateEnrollmentDto): Promise<Enrollment> {
    const e = await this.enrollmentRepo.findOne({ where: { id }, relations: { session: { training: true } } });
    if (!e) throw new NotFoundException('Enrollment not found');
    const previous = e.status;
    if (dto.score !== undefined) e.score = dto.score;
    if (dto.progress !== undefined) e.progress = dto.progress;
    if (dto.status) {
      e.status = dto.status;
      if (dto.status === EnrollmentStatus.PASSED) {
        if (previous !== EnrollmentStatus.PASSED) {
          const now = new Date();
          e.completedAt = now;
          const months = e.session?.training?.validityMonths;
          e.expiresAt = months ? this.addMonths(now, months) : null;
        }
        if (dto.progress === undefined) e.progress = 100;
      } else if (previous === EnrollmentStatus.PASSED) {
        e.completedAt = null;
        e.expiresAt = null;
      }
    }
    const saved = await this.enrollmentRepo.save(e);
    if (dto.status && dto.status !== previous && (dto.status === EnrollmentStatus.PASSED || dto.status === EnrollmentStatus.FAILED)) {
      const passed = dto.status === EnrollmentStatus.PASSED;
      await this.notifications.notifyUsers([e.userId], {
        type: NotificationType.TRAINING,
        title: passed ? 'Formation validee' : 'Formation non validee',
        body: `Formation "${e.session?.training?.title}" : ${passed ? 'reussie' : 'echouee'}.`,
        data: { key: `enrollment-result:${e.id}:${dto.status}`, enrollmentId: e.id, sessionId: e.sessionId },
      });
    }
    return saved;
  }

  private decorate(e: Enrollment, now = new Date()) {
    const exp = e.expiresAt ? new Date(e.expiresAt).getTime() : null;
    const isExpired = exp !== null && exp < now.getTime();
    const expiresSoon = exp !== null && !isExpired && exp <= now.getTime() + EXPIRES_SOON_DAYS * DAY;
    return { ...e, isExpired, expiresSoon };
  }

  /** My enrollments with session + training and certification expiry flags. */
  async myEnrollments(userId: number, q: MyTrainingsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const qb = this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.session', 's')
      .innerJoinAndSelect('s.training', 't')
      .where('e.userId = :userId', { userId })
      .orderBy('s.startAt', 'DESC')
      .addOrderBy('e.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (q.status) qb.andWhere('e.status = :status', { status: q.status });
    else qb.andWhere('e.status != :cancelled', { cancelled: EnrollmentStatus.CANCELLED });
    const [rows, total] = await qb.getManyAndCount();
    const now = new Date();
    return { data: rows.map((e) => this.decorate(e, now)), total, page, limit };
  }

  // ---------- Skills report (C4.3) & auto-plan (C4.1) ----------

  async computeSkills(department?: string, now = new Date()): Promise<UserSkills[]> {
    const users = (
      await this.userRepo.find({
        where: { isActive: true, ...(department ? { department } : {}) },
        select: ['id', 'firstName', 'lastName', 'department', 'roles'],
        order: { lastName: 'ASC', firstName: 'ASC', id: 'ASC' },
      })
    ).filter((u) => u.roles?.length && !u.roles.includes(Role.PENDING));
    if (!users.length) return [];

    const mandatory = (await this.trainingRepo.find({ where: { isActive: true } })).filter((t) => t.mandatoryForRoles?.length);
    const passed = mandatory.length
      ? await this.enrollmentRepo
          .createQueryBuilder('e')
          .innerJoinAndSelect('e.session', 's')
          .where('e.status = :st AND e.userId IN (:...ids) AND s.trainingId IN (:...tids)', {
            st: EnrollmentStatus.PASSED,
            ids: users.map((u) => u.id),
            tids: mandatory.map((t) => t.id),
          })
          .getMany()
      : [];
    const byUserTraining = new Map<string, Enrollment>();
    for (const e of passed) {
      const key = `${e.userId}:${e.session.trainingId}`;
      const cur = byUserTraining.get(key);
      if (!cur || (e.completedAt?.getTime() ?? 0) > (cur.completedAt?.getTime() ?? 0)) byUserTraining.set(key, e);
    }

    const soonLimit = now.getTime() + EXPIRES_SOON_DAYS * DAY;
    return users.map((u) => {
      const res: UserSkills = { userId: u.id, firstName: u.firstName, lastName: u.lastName, department: u.department, acquired: [], expiring: [], missing: [] };
      for (const t of mandatory.filter((m) => m.mandatoryForRoles.some((r) => u.roles.includes(r as Role)))) {
        const e = byUserTraining.get(`${u.id}:${t.id}`);
        const base = { trainingId: t.id, title: t.title };
        if (!e) res.missing.push({ ...base, expired: false });
        else if (e.expiresAt && e.expiresAt.getTime() < now.getTime()) res.missing.push({ ...base, completedAt: e.completedAt, expiresAt: e.expiresAt, expired: true });
        else if (e.expiresAt && e.expiresAt.getTime() <= soonLimit) res.expiring.push({ ...base, completedAt: e.completedAt, expiresAt: e.expiresAt });
        else res.acquired.push({ ...base, completedAt: e.completedAt, expiresAt: e.expiresAt });
      }
      return res;
    });
  }

  async skillsReport(department?: string) {
    const now = new Date();
    const all = await this.computeSkills(department, now);
    const users = all.filter((u) => u.acquired.length + u.expiring.length + u.missing.length > 0);
    const compliant = users.filter((u) => !u.missing.length).length;
    return {
      department: department ?? null,
      generatedAt: now,
      summary: {
        users: users.length,
        compliantUsers: compliant,
        complianceRate: users.length ? Math.round((compliant / users.length) * 1000) / 10 : 100,
        acquired: users.reduce((n, u) => n + u.acquired.length, 0),
        expiring: users.reduce((n, u) => n + u.expiring.length, 0),
        missing: users.reduce((n, u) => n + u.missing.length, 0),
      },
      users,
    };
  }

  /** Lists users lacking valid mandatory trainings (with the next planned session) and notifies them. */
  async autoPlan(dto: AutoPlanDto) {
    const now = new Date();
    const lacking = (await this.computeSkills(dto.department, now)).filter((u) => u.missing.length);
    const trainingIds = [...new Set(lacking.flatMap((u) => u.missing.map((m) => m.trainingId)))];
    const next = new Map<number, { id: number; startAt: Date }>();
    if (trainingIds.length) {
      const sessions = await this.sessionRepo.find({
        where: { trainingId: In(trainingIds), status: SessionStatus.PLANNED },
        order: { startAt: 'ASC' },
      });
      for (const s of sessions) {
        if (s.startAt.getTime() >= now.getTime() && !next.has(s.trainingId)) next.set(s.trainingId, { id: s.id, startAt: s.startAt });
      }
    }

    let notified = 0;
    const users = [];
    for (const u of lacking) {
      const missing = u.missing.map((m) => ({ ...m, nextSession: next.get(m.trainingId) ?? null }));
      users.push({ userId: u.userId, firstName: u.firstName, lastName: u.lastName, department: u.department, missing });
      if (dto.dryRun) continue;
      const sent = await this.notifications.notifyUsersOnce([u.userId], {
        type: NotificationType.TRAINING,
        title: 'Formations obligatoires a suivre',
        body: `Formation(s) obligatoire(s) a suivre ou renouveler : ${missing.map((m) => m.title).join(', ')}.`,
        data: { key: `autoplan:${missing.map((m) => m.trainingId).sort((a, b) => a - b).join('-')}`, trainingIds: missing.map((m) => m.trainingId) },
      });
      notified += sent.length;
    }
    return { total: users.length, notified, dryRun: !!dto.dryRun, users };
  }

  // ---------- Scheduled job (daily 07:00 Africa/Algiers) ----------

  @Cron('0 7 * * *', { name: 'trainings-daily-checks', timeZone: 'Africa/Algiers' })
  async runDailyChecks(now = new Date()): Promise<{ reminders: number; certifications: number }> {
    try {
      const reminders = (await this.notifySessionReminders(now, 7)) + (await this.notifySessionReminders(now, 1));
      const certifications = await this.notifyExpiringCertifications(now);
      return { reminders, certifications };
    } catch (err) {
      this.logger.error(`trainings daily checks failed: ${(err as Error).message}`);
      return { reminders: 0, certifications: 0 };
    }
  }

  /** Enrolled users are reminded of sessions starting in `daysAhead` days (24h window centred on now + N days). */
  async notifySessionReminders(now: Date, daysAhead: number): Promise<number> {
    const centre = now.getTime() + daysAhead * DAY;
    const sessions = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.training', 't')
      .where('s.status = :planned AND s.startAt >= :from AND s.startAt < :to', {
        planned: SessionStatus.PLANNED,
        from: new Date(centre - DAY / 2),
        to: new Date(centre + DAY / 2),
      })
      .getMany();
    let count = 0;
    for (const s of sessions) {
      const enrolled = await this.enrollmentRepo.find({ where: { sessionId: s.id, status: EnrollmentStatus.REGISTERED }, select: ['id', 'userId'] });
      if (!enrolled.length) continue;
      const sent = await this.notifications.notifyUsersOnce(
        enrolled.map((e) => e.userId),
        {
          type: NotificationType.TRAINING,
          title: daysAhead === 1 ? 'Formation demain' : `Formation dans ${daysAhead} jours`,
          body: `La session "${s.training?.title}" commence le ${s.startAt.toISOString().slice(0, 16).replace('T', ' ')} UTC${s.location ? ` (${s.location})` : ''}.`,
          data: { key: `session-reminder:${s.id}:${daysAhead}`, sessionId: s.id, trainingId: s.trainingId },
        },
      );
      count += sent.length;
    }
    return count;
  }

  /** Certifications expiring within 30 days: the user and managers are notified at 30/14/7/1-day thresholds. */
  async notifyExpiringCertifications(now: Date): Promise<number> {
    const limit = new Date(now.getTime() + EXPIRES_SOON_DAYS * DAY);
    const rows = await this.enrollmentRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.session', 's')
      .innerJoinAndSelect('s.training', 't')
      .innerJoinAndSelect('e.user', 'u')
      .where('e.status = :st AND e.expiresAt IS NOT NULL AND e.expiresAt >= :now AND e.expiresAt <= :limit', {
        st: EnrollmentStatus.PASSED,
        now,
        limit,
      })
      .getMany();
    for (const e of rows) {
      const daysLeft = Math.ceil((e.expiresAt.getTime() - now.getTime()) / DAY);
      const bucket = daysLeft <= 1 ? 1 : daysLeft <= 7 ? 7 : daysLeft <= 14 ? 14 : 30;
      const date = e.expiresAt.toISOString().slice(0, 10);
      const key = `cert:${e.id}:${bucket}`;
      const data = { key, enrollmentId: e.id, trainingId: e.session.trainingId, userId: e.userId, expiresAt: e.expiresAt };
      const window = 24 * 30;
      await this.notifications.notifyUsersOnce([e.userId], {
        type: NotificationType.TRAINING,
        title: 'Certification bientot expiree',
        body: `Votre certification "${e.session.training.title}" expire le ${date}.`,
        data,
      }, window);
      await this.notifications.notifyRolesOnce(MANAGER_ROLES, {
        type: NotificationType.TRAINING,
        title: 'Certification bientot expiree',
        body: `La certification "${e.session.training.title}" de ${e.user.firstName ?? ''} ${e.user.lastName ?? ''} expire le ${date}.`.replace(/\s+/g, ' '),
        data,
      }, window);
    }
    return rows.length;
  }
}
