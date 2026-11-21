import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { User } from '../users/entities/user.entity';
import { IncidentSeverity } from '../incidents/enums/incident-severity.enum';

export type Badge = 'bronze' | 'silver' | 'gold' | 'platinum';

/** Badge thresholds (total points, inclusive), ascending. Documented in docs/API_CONTRACT.md § Rewards. */
export const BADGE_THRESHOLDS: { badge: Badge; min: number }[] = [
  { badge: 'bronze', min: 20 },
  { badge: 'silver', min: 50 },
  { badge: 'gold', min: 100 },
  { badge: 'platinum', min: 200 },
];

export function badgeFor(points: number): Badge | null {
  let current: Badge | null = null;
  for (const t of BADGE_THRESHOLDS) if (points >= t.min) current = t.badge;
  return current;
}

/** Points needed for the next badge, or null once platinum is reached. */
export function nextBadgeAt(points: number): number | null {
  return BADGE_THRESHOLDS.find((t) => points < t.min)?.min ?? null;
}

export type LeaderboardPeriod = 'month' | 'year' | 'all';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(Reward) private rewardsRepo: Repository<Reward>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async awardForIncident(
    userId: number,
    incidentId: string,
    payload: { severity: IncidentSeverity; hasPhoto: boolean; hasLocation: boolean },
  ): Promise<{ pointsAwarded: number; totalPoints: number }> {
    const existing = await this.rewardsRepo.findOne({ where: { incidentId } });
    if (existing) {
      const totalPoints = await this.getTotalPoints(userId);
      return { pointsAwarded: 0, totalPoints };
    }

    const points = this.calculateIncidentPoints(payload);
    const reward = this.rewardsRepo.create({
      user_id: userId,
      incidentId,
      points,
      reason: 'incident_report',
    });
    await this.rewardsRepo.save(reward);

    const totalPoints = await this.getTotalPoints(userId);
    return { pointsAwarded: points, totalPoints };
  }

  private calculateIncidentPoints({
    severity,
    hasPhoto,
    hasLocation,
  }: {
    severity: IncidentSeverity;
    hasPhoto: boolean;
    hasLocation: boolean;
  }): number {
    let pts = this.severityPoints(severity);
    if (hasPhoto) pts += 3;
    if (hasLocation) pts += 2;
    return pts;
  }

  private severityPoints(sev: IncidentSeverity): number {
    switch (sev) {
      case IncidentSeverity.LOW:
        return 5;
      case IncidentSeverity.MEDIUM:
        return 8;
      case IncidentSeverity.HIGH:
        return 12;
      case IncidentSeverity.CRITICAL:
        return 15;
      default:
        return 5;
    }
  }

  async getTotalPoints(userId: number): Promise<number> {
    const { sum } = await this.rewardsRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.points), 0)', 'sum')
      .where('r.user_id = :userId', { userId })
      .getRawOne();
    return Number(sum);
  }

  async getMyRewards(userId: number): Promise<Reward[]> {
    return this.rewardsRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Revokes the points granted for a rejected incident. The row is kept (points -> 0, reason
   * `incident_rejected`) so the unique incidentId constraint prevents any later re-award.
   * Returns the number of points removed (0 when nothing was granted or already revoked).
   */
  async revokeForIncident(incidentId: string): Promise<number> {
    const reward = await this.rewardsRepo.findOne({ where: { incidentId } });
    if (!reward || reward.points <= 0) return 0;
    const revoked = reward.points;
    reward.points = 0;
    reward.reason = 'incident_rejected';
    await this.rewardsRepo.save(reward);
    return revoked;
  }

  /** `rank` = 1 + number of users with strictly more points (null while the user has no points). */
  async getSummary(userId: number): Promise<{ totalPoints: number; rank: number | null; badge: Badge | null; nextBadgeAt: number | null }> {
    const totalPoints = await this.getTotalPoints(userId);
    let rank: number | null = null;
    if (totalPoints > 0) {
      const [{ better }] = await this.rewardsRepo.query(
        'SELECT COUNT(*)::int AS better FROM (SELECT user_id, SUM(points) AS total FROM reward GROUP BY user_id) t WHERE t.total > $1',
        [totalPoints],
      );
      rank = Number(better) + 1;
    }
    return { totalPoints, rank, badge: badgeFor(totalPoints), nextBadgeAt: nextBadgeAt(totalPoints) };
  }

  async getLeaderboard(period: LeaderboardPeriod = 'all', limit = 10, now = new Date()) {
    const qb = this.rewardsRepo
      .createQueryBuilder('r')
      .innerJoin('r.user', 'u')
      .select('u.id', 'userId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('SUM(r.points)', 'points')
      .where('u.isActive = true')
      .groupBy('u.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .having('SUM(r.points) > 0')
      .orderBy('points', 'DESC')
      .addOrderBy('u.id', 'ASC')
      .limit(limit);
    if (period === 'month') qb.andWhere('r.created_at >= :since', { since: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) });
    if (period === 'year') qb.andWhere('r.created_at >= :since', { since: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)) });
    const rows = await qb.getRawMany();
    return rows.map((row, i) => {
      const points = Number(row.points);
      return { rank: i + 1, userId: Number(row.userId), firstName: row.firstName, lastName: row.lastName, points, badge: badgeFor(points) };
    });
  }
}
