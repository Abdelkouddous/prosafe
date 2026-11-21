import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { In, Repository } from 'typeorm';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { DeviceToken } from './entities/device-token.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { NotificationPriority, NotificationType } from './enums/notification-type.enum';
import { ListNotificationsQueryDto, RegisterDeviceDto, UpdatePreferencesDto } from './dto/notifications.dto';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
}

export const PREFERENCE_DEFAULTS: UpdatePreferencesDto = {
  incidents: true,
  trainings: true,
  audits: true,
  inventory: true,
  emergency: true,
  messages: true,
  push: true,
  email: true,
};

/** Preference flag controlling each type. Types absent here (alert, system) are always delivered. */
const TYPE_PREFERENCE: Partial<Record<NotificationType, keyof UpdatePreferencesDto>> = {
  [NotificationType.INCIDENT]: 'incidents',
  [NotificationType.TRAINING]: 'trainings',
  [NotificationType.AUDIT]: 'audits',
  [NotificationType.INVENTORY]: 'inventory',
  [NotificationType.MAINTENANCE]: 'inventory',
  [NotificationType.MESSAGE]: 'messages',
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectRepository(DeviceToken) private readonly deviceRepo: Repository<DeviceToken>,
    @InjectRepository(NotificationPreference) private readonly prefRepo: Repository<NotificationPreference>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly mailer: MailerService,
    @Optional() private readonly realtime?: RealtimeGateway,
  ) {}

  // ---------- Dispatch API (used by other modules) ----------

  /** Notify users by role (active users only). Never throws. */
  async notifyRoles(roles: Role[], payload: NotificationPayload): Promise<void> {
    try {
      const users = await this.userRepo.find({ where: { isActive: true }, select: ['id', 'roles'] });
      const ids = users.filter((u) => u.roles?.some((r) => roles.includes(r))).map((u) => u.id);
      await this.notifyUsers(ids, payload);
    } catch (err) {
      this.logger.error(`notifyRoles failed: ${(err as Error).message}`);
    }
  }

  /**
   * Like notifyUsers but skips users who already received a notification of the same type and
   * `data.key` in the last `windowHours` (default 24h), so scheduled jobs / double clicks never spam.
   * Returns the ids actually notified. Never throws.
   */
  async notifyUsersOnce(
    userIds: number[],
    payload: NotificationPayload & { data: { key: string } },
    windowHours = 24,
  ): Promise<number[]> {
    try {
      const ids = [...new Set(userIds)].filter((id) => Number.isInteger(id));
      if (!ids.length) return [];
      const hours = Math.max(1, Math.floor(Number(windowHours)) || 24);
      const recent: { userId: number }[] = await this.notifRepo
        .createQueryBuilder('n')
        .select('n.userId', 'userId')
        .where('n.userId IN (:...ids)', { ids })
        .andWhere('n.type = :type', { type: payload.type })
        .andWhere("n.data ->> 'key' = :key", { key: payload.data.key })
        .andWhere(`n."createdAt" > now() - interval '${hours} hours'`)
        .getRawMany();
      const already = new Set(recent.map((r) => Number(r.userId)));
      const toNotify = ids.filter((id) => !already.has(id));
      if (toNotify.length) await this.notifyUsers(toNotify, payload);
      return toNotify;
    } catch (err) {
      this.logger.error(`notifyUsersOnce failed: ${(err as Error).message}`);
      return [];
    }
  }

  /** Role-based variant of notifyUsersOnce. Never throws. */
  async notifyRolesOnce(
    roles: Role[],
    payload: NotificationPayload & { data: { key: string } },
    windowHours = 24,
  ): Promise<number[]> {
    try {
      const users = await this.userRepo.find({ where: { isActive: true }, select: ['id', 'roles'] });
      const ids = users.filter((u) => u.roles?.some((r) => roles.includes(r))).map((u) => u.id);
      return await this.notifyUsersOnce(ids, payload, windowHours);
    } catch (err) {
      this.logger.error(`notifyRolesOnce failed: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Notify users: honours per-type preference (emergency is always delivered), stores a DB row,
   * sends Expo push (when `push` pref on) and an email (when `email` pref on and priority high / emergency).
   * Never throws: failures are logged.
   */
  async notifyUsers(userIds: number[], payload: NotificationPayload): Promise<void> {
    try {
      const ids = [...new Set(userIds)].filter((id) => Number.isInteger(id));
      if (!ids.length) return;

      const prefs = await this.prefRepo.find({ where: { userId: In(ids) } });
      const prefByUser = new Map(prefs.map((p) => [p.userId, p]));
      const isEmergency = payload.type === NotificationType.EMERGENCY;
      const prefKey = TYPE_PREFERENCE[payload.type];

      const recipients: { id: number; pref: UpdatePreferencesDto }[] = [];
      for (const id of ids) {
        const pref = { ...PREFERENCE_DEFAULTS, ...(prefByUser.get(id) ?? {}) } as UpdatePreferencesDto;
        if (!isEmergency && prefKey && !pref[prefKey]) continue;
        recipients.push({ id, pref });
      }
      if (!recipients.length) return;

      const saved = await this.notifRepo.save(
        recipients.map((r) =>
          this.notifRepo.create({ userId: r.id, type: payload.type, title: payload.title, body: payload.body, data: payload.data ?? null }),
        ),
      );
      // Realtime push to connected clients (no-op without a running socket server)
      for (const n of saved ?? []) this.realtime?.emitToUsers([n.userId], 'notification:new', n);

      const pushUsers = recipients.filter((r) => isEmergency || r.pref.push).map((r) => r.id);
      await this.sendPush(pushUsers, payload).catch((e) => this.logger.error(`push failed: ${(e as Error).message}`));

      if (isEmergency || payload.priority === 'high') {
        const mailUsers = recipients.filter((r) => isEmergency || r.pref.email).map((r) => r.id);
        await this.sendEmails(mailUsers, payload).catch((e) => this.logger.error(`email failed: ${(e as Error).message}`));
      }
    } catch (err) {
      this.logger.error(`notifyUsers failed: ${(err as Error).message}`);
    }
  }

  private async sendPush(userIds: number[], payload: NotificationPayload): Promise<void> {
    if (!userIds.length) return;
    const devices = await this.deviceRepo.find({ where: { userId: In(userIds) } });
    const messages: ExpoPushMessage[] = [];
    for (const d of devices) {
      if (!Expo.isExpoPushToken(d.token)) {
        this.logger.warn(`Skipping invalid push token (device ${d.id})`);
        continue;
      }
      messages.push({
        to: d.token,
        title: payload.title,
        body: payload.body,
        data: { type: payload.type, ...(payload.data ?? {}) },
        priority: payload.priority === 'high' || payload.type === NotificationType.EMERGENCY ? 'high' : 'default',
        sound: 'default',
      });
    }
    if (!messages.length) return;

    const dead: string[] = [];
    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      try {
        const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.forEach((t, i) => {
          if (t.status === 'error') {
            if (t.details?.error === 'DeviceNotRegistered') dead.push(String((chunk[i] as ExpoPushMessage).to));
            else this.logger.warn(`Expo push error: ${t.message}`);
          }
        });
      } catch (err) {
        this.logger.error(`Expo chunk failed: ${(err as Error).message}`);
      }
    }
    if (dead.length) await this.deviceRepo.delete({ token: In(dead) });
  }

  private async sendEmails(userIds: number[], payload: NotificationPayload): Promise<void> {
    if (!userIds.length) return;
    const users = await this.userRepo.find({ where: { id: In(userIds) }, select: ['id', 'email'] });
    for (const u of users) {
      if (!u.email) continue;
      try {
        await this.mailer.sendMail({
          to: u.email,
          subject: `[PROSAFE] ${payload.title}`,
          text: payload.body,
        });
      } catch (err) {
        this.logger.warn(`Email to user ${u.id} failed: ${(err as Error).message}`);
      }
    }
  }

  // ---------- Endpoints logic ----------

  async list(userId: number, q: ListNotificationsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.notifRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .addOrderBy('n.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (q.unread) qb.andWhere('n.readAt IS NULL');
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async markRead(userId: number, id: number): Promise<Notification> {
    const n = await this.notifRepo.findOne({ where: { id, userId } });
    if (!n) throw new NotFoundException('Notification not found');
    if (!n.readAt) {
      n.readAt = new Date();
      await this.notifRepo.save(n);
    }
    return n;
  }

  async markAllRead(userId: number): Promise<{ updated: number }> {
    const res = await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: () => 'now()' })
      .where('"userId" = :userId AND "readAt" IS NULL', { userId })
      .execute();
    return { updated: res.affected ?? 0 };
  }

  async registerDevice(userId: number, dto: RegisterDeviceDto): Promise<DeviceToken> {
    const existing = await this.deviceRepo.findOne({ where: { token: dto.token } });
    if (existing) {
      // A token belongs to the device: re-assign it to the current user (account switch on the same phone).
      existing.userId = userId;
      existing.platform = dto.platform;
      existing.lastSeenAt = new Date();
      return this.deviceRepo.save(existing);
    }
    return this.deviceRepo.save(this.deviceRepo.create({ userId, token: dto.token, platform: dto.platform, lastSeenAt: new Date() }));
  }

  async removeDevice(userId: number, token: string): Promise<{ deleted: boolean }> {
    const res = await this.deviceRepo.delete({ userId, token });
    return { deleted: (res.affected ?? 0) > 0 };
  }

  async getPreferences(userId: number): Promise<UpdatePreferencesDto> {
    const p = await this.prefRepo.findOne({ where: { userId } });
    return this.toDto(p);
  }

  async updatePreferences(userId: number, dto: UpdatePreferencesDto): Promise<UpdatePreferencesDto> {
    let p = await this.prefRepo.findOne({ where: { userId } });
    p = this.prefRepo.merge(p ?? this.prefRepo.create({ userId }), dto);
    return this.toDto(await this.prefRepo.save(p));
  }

  private toDto(p: NotificationPreference | null): UpdatePreferencesDto {
    const out = { ...PREFERENCE_DEFAULTS };
    if (p) for (const k of Object.keys(out)) out[k] = p[k];
    return out;
  }
}
