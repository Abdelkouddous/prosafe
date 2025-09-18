import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async create(@Body() createIncidentDto: CreateIncidentDto, @UploadedFile() photo: any, @Request() req: any) {
    return this.incidentsService.create(createIncidentDto, photo, req.user.id);
  }

  @Get()
  async findAll() {
    return this.incidentsService.findAll();
  }

  // Move my-incidents BEFORE the :incidentId route
  @Get('my-incidents')
  async findMyIncidents(@Request() req: any) {
    return this.incidentsService.findMyIncidents(req.user.id);
  }

  @Get(':incidentId')
  async findOne(@Param('incidentId') incidentId: string) {
    return this.incidentsService.findOne(incidentId);
  }

  @Patch(':incidentId/status')
  async updateStatus(@Param('incidentId') incidentId: string, @Body() updateStatusDto: UpdateIncidentStatusDto, @Request() req: any) {
    return this.incidentsService.updateStatus(incidentId, updateStatusDto, req.user.id);
  }

  

  //
  // @Patch(':incidentId')
  // async update(@Param('incidentId') incidentId: string, @Body() updateIncidentDto: CreateIncidentDto, @Request() req: any) {
  //   return this.incidentsService.update(incidentId, req.user.id);
  // }
}
