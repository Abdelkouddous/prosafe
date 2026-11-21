import { Controller, Get, Post, Body, Patch, Param, Query, UseInterceptors, UploadedFiles, UseGuards, Request } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role, MANAGER_ROLES } from '../users/enums/role.enum';
import { buildMulterOptions } from '../files/upload.config';
import { CleanupUploadsOnErrorInterceptor } from '../files/cleanup-uploads.interceptor';
import { IncidentsService, MAX_MEDIA } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents-query.dto';

const scopeOf = (user: { id: number; roles?: Role[] }) => ({
  userId: user.id,
  isManager: MANAGER_ROLES.some((r) => user.roles?.includes(r)),
});

@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  /** Multipart: fields per CreateIncidentDto + up to 5 files in `media` (legacy single `photo` field is also accepted). */
  @Post()
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'media', maxCount: MAX_MEDIA },
        { name: 'photo', maxCount: 1 },
      ],
      buildMulterOptions(['image', 'video'], MAX_MEDIA + 1),
    ),
    CleanupUploadsOnErrorInterceptor,
  )
  async create(
    @Body() createIncidentDto: CreateIncidentDto,
    @UploadedFiles() files: { media?: Express.Multer.File[]; photo?: Express.Multer.File[] },
    @Request() req: any,
  ) {
    const all = [...(files?.media ?? []), ...(files?.photo ?? [])];
    return this.incidentsService.create(createIncidentDto, all, req.user.id);
  }

  /** Managers see every incident; employees only their own. Paginated + filters. */
  @Get()
  async findAll(@Query() query: ListIncidentsQueryDto, @Request() req: any) {
    return this.incidentsService.findAll(query, scopeOf(req.user));
  }

  // Static route BEFORE the :incidentId route
  @Get('my-incidents')
  async findMyIncidents(@Request() req: any) {
    return this.incidentsService.findMyIncidents(req.user.id);
  }

  /** :incidentId is the numeric id or the INC-... code. */
  @Get(':incidentId')
  async findOne(@Param('incidentId') incidentId: string, @Request() req: any) {
    return this.incidentsService.findOne(incidentId, scopeOf(req.user));
  }

  @Patch(':incidentId/status')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  async updateStatus(@Param('incidentId') incidentId: string, @Body() updateStatusDto: UpdateIncidentStatusDto, @Request() req: any) {
    return this.incidentsService.updateStatus(incidentId, updateStatusDto, req.user.id);
  }
}
