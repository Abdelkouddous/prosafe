import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { MANAGER_ROLES, Role } from '../users/enums/role.enum';
import { ForecastQueryDto, IncidentsStatsQueryDto, PeriodQueryDto } from './dto/stats.dto';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  /** Home dashboard. Managers: global figures. Employees: own incident counts + global active alerts. */
  @Get('overview')
  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  overview(@Req() req) {
    return this.stats.overview({ id: req.user.id, isManager: MANAGER_ROLES.some((r) => req.user.roles?.includes(r)) });
  }

  @Get('incidents')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  incidents(@Query() q: IncidentsStatsQueryDto) {
    return this.stats.incidentsBy(q.groupBy ?? 'month', q);
  }

  @Get('kpis')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  kpis(@Query() q: PeriodQueryDto) {
    return this.stats.kpis(q);
  }

  @Get('forecast')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  forecast(@Query() q: ForecastQueryDto) {
    return this.stats.forecast(q.months ?? 3);
  }
}
