import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { RewardsService } from './rewards.service';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
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