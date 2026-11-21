import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { AlertSeverity } from './enums/alert-severity.enum';
import { AlertStatus } from './enums/alert-status.enum';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard, EmailVerifiedGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Post()
  async create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('severity') severity?: AlertSeverity,
    @Query('status') status?: AlertStatus,
  ) {
    return this.alertsService.findAll(+page, +limit, severity, status);
  }

  @Get('stats')
  async getStats() {
    return this.alertsService.getAlertStats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alertsService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateAlertDto: UpdateAlertDto, @Req() req) {

    if (updateAlertDto.status) {
      updateAlertDto.resolved_by_id = req.user.id;
    }

    return this.alertsService.update(id, updateAlertDto);
  }

  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.alertsService.remove(id);
  }
}
