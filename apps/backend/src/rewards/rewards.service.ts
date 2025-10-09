import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { User } from '../users/entities/user.entity';
import { IncidentSeverity } from '../incidents/enums/incident-severity.enum';

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
}