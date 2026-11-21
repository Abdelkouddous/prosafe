import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import {
  CreateDrillDto, CreateScenarioDto, ListDrillsQueryDto, ListEventsQueryDto, ListScenariosQueryDto, TriggerEmergencyDto, UpdateDrillDto,
  UpdateScenarioDto,
} from './dto/emergency.dto';
import { EmergencyService } from './emergency.service';

@ApiTags('emergency')
@ApiBearerAuth()
@Controller('emergency')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
export class EmergencyController {
  constructor(private readonly service: EmergencyService) {}

  // ---- scenarios ----

  @Get('scenarios')
  @ApiOperation({ summary: 'Emergency scenarios (employees: active ones only)' })
  listScenarios(@Query() q: ListScenariosQueryDto, @Req() req) {
    return this.service.listScenarios(q, req.user);
  }

  @Get('scenarios/:id')
  getScenario(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.getScenario(id, req.user);
  }

  @Post('scenarios')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  createScenario(@Body() dto: CreateScenarioDto) {
    return this.service.createScenario(dto);
  }

  @Patch('scenarios/:id')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  updateScenario(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateScenarioDto) {
    return this.service.updateScenario(id, dto);
  }

  @Delete('scenarios/:id')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  removeScenario(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeScenario(id);
  }

  // ---- events ----

  @Post('trigger')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @ApiOperation({ summary: 'Trigger an emergency: event + alert + high-priority notification to all users' })
  trigger(@Body() dto: TriggerEmergencyDto, @Req() req) {
    return this.service.trigger(dto, req.user);
  }

  @Get('events')
  listEvents(@Query() q: ListEventsQueryDto) {
    return this.service.listEvents(q);
  }

  @Patch('events/:id/close')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  closeEvent(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.closeEvent(id, req.user);
  }

  // ---- drills ----

  @Get('drills')
  listDrills(@Query() q: ListDrillsQueryDto) {
    return this.service.listDrills(q);
  }

  @Get('drills/:id')
  getDrill(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDrill(id);
  }

  @Post('drills')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  createDrill(@Body() dto: CreateDrillDto, @Req() req) {
    return this.service.createDrill(dto, req.user);
  }

  @Patch('drills/:id')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  updateDrill(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDrillDto) {
    return this.service.updateDrill(id, dto);
  }

  @Delete('drills/:id')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  removeDrill(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeDrill(id);
  }
}
