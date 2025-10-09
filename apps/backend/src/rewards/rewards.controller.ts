import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RewardsService } from './rewards.service';

@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private rewards: RewardsService) {}

  @Get('me')
  getMine(@Request() req: any) {
    return this.rewards.getMyRewards(req.user.id);
  }

  @Get('me/summary')
  async summary(@Request() req: any) {
    const totalPoints = await this.rewards.getTotalPoints(req.user.id);
    return { totalPoints };
  }
}