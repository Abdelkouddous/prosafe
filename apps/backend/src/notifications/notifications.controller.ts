import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { ListNotificationsQueryDto, RegisterDeviceDto, UpdatePreferencesDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

/** All endpoints act on the authenticated user's own data. */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@Request() req, @Query() query: ListNotificationsQueryDto) {
    return this.service.list(req.user.id, query);
  }

  // Static routes before ':id'
  @Patch('read-all')
  readAll(@Request() req) {
    return this.service.markAllRead(req.user.id);
  }

  @Get('preferences')
  getPreferences(@Request() req) {
    return this.service.getPreferences(req.user.id);
  }

  @Put('preferences')
  updatePreferences(@Request() req, @Body() dto: UpdatePreferencesDto) {
    return this.service.updatePreferences(req.user.id, dto);
  }

  @Post('devices')
  registerDevice(@Request() req, @Body() dto: RegisterDeviceDto) {
    return this.service.registerDevice(req.user.id, dto);
  }

  @Delete('devices/:token')
  removeDevice(@Request() req, @Param('token') token: string) {
    return this.service.removeDevice(req.user.id, token);
  }

  @Patch(':id/read')
  markRead(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(req.user.id, id);
  }
}
