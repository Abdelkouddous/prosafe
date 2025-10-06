import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { Role } from '../users/enums/role.enum';
import { AlertSeverity } from './enums/alert-severity.enum';
import { AlertStatus } from './enums/alert-status.enum';

@Controller('alerts')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  async create(@Body() createAlertDto: CreateAlertDto, @Req() req) {
    // Only admins can create alerts manually
    if (!req.user.roles.includes(Role.admin)) {
      throw new Error('Forbidden: Only admins can create alerts');
    }
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
  async findOne(@Param('id') id: string) {
    return this.alertsService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto, @Req() req) {
    // Only admins can update alerts
    if (!req.user.roles.includes(Role.admin)) {
      throw new Error('Forbidden: Only admins can update alerts');
    }

    if (updateAlertDto.status) {
      updateAlertDto.resolved_by_id = req.user.id;
    }

    return this.alertsService.update(+id, updateAlertDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    // Only admins can delete alerts
    if (!req.user.roles.includes(Role.admin)) {
      throw new Error('Forbidden: Only admins can delete alerts');
    }
    return this.alertsService.remove(+id);
  }
}
