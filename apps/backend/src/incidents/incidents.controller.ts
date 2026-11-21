import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role, MANAGER_ROLES } from '../users/enums/role.enum';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

const isManager = (user: { roles?: Role[] }) => MANAGER_ROLES.some((r) => user.roles?.includes(r));

@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async create(@Body() createIncidentDto: CreateIncidentDto, @UploadedFile() photo: any, @Request() req: any) {
    return this.incidentsService.create(createIncidentDto, photo, req.user.id);
  }

  /** Managers see every incident; employees only their own. */
  @Get()
  async findAll(@Request() req: any) {
    return this.incidentsService.findAll(isManager(req.user) ? undefined : req.user.id);
  }

  // Static route BEFORE the :incidentId route
  @Get('my-incidents')
  async findMyIncidents(@Request() req: any) {
    return this.incidentsService.findMyIncidents(req.user.id);
  }

  @Get(':incidentId')
  async findOne(@Param('incidentId') incidentId: string, @Request() req: any) {
    return this.incidentsService.findOne(incidentId, isManager(req.user) ? undefined : req.user.id);
  }

  @Patch(':incidentId/status')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  async updateStatus(@Param('incidentId') incidentId: string, @Body() updateStatusDto: UpdateIncidentStatusDto, @Request() req: any) {
    return this.incidentsService.updateStatus(incidentId, updateStatusDto, req.user.id);
  }
}
