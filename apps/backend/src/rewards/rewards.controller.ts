import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { LeaderboardPeriod, RewardsService } from './rewards.service';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: ['month', 'year', 'all'], default: 'all' })
  @IsOptional()
  @IsIn(['month', 'year', 'all'])
  period?: LeaderboardPeriod = 'all';

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
@Controller('rewards')
export class RewardsController {
  constructor(private rewards: RewardsService) {}

  @Get('me')
  getMine(@Request() req: any) {
    return this.rewards.getMyRewards(req.user.id);
  }

  /** `{ totalPoints, rank, badge, nextBadgeAt }` */
  @Get('me/summary')
  summary(@Request() req: any) {
    return this.rewards.getSummary(req.user.id);
  }

  /** Top users by points over the period (names included). */
  @Get('leaderboard')
  leaderboard(@Query() q: LeaderboardQueryDto) {
    return this.rewards.getLeaderboard(q.period, q.limit);
  }
}
