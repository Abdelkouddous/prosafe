import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { MaintenanceService } from './maintenance.service';
import { CompleteMaintenanceDto, CreateMaintenanceDto, ListMaintenanceQueryDto, UpdateMaintenanceDto } from './dto/maintenance.dto';

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  list(@Query() q: ListMaintenanceQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  create(@Body() dto: CreateMaintenanceDto) {
    return this.service.create(dto);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  complete(@Param('id', ParseIntPipe) id: number, @Body() dto: CompleteMaintenanceDto, @Req() req) {
    return this.service.complete(id, dto, req.user.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaintenanceDto) {
    return this.service.update(id, dto);
  }
}
