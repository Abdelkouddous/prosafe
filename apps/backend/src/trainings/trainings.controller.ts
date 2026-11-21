import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { TrainingsService } from './trainings.service';
import {
  AutoPlanDto,
  CreateSessionDto,
  CreateTrainingDto,
  EnrollDto,
  ListSessionsQueryDto,
  ListTrainingsQueryDto,
  MyTrainingsQueryDto,
  PaginationDto,
  SkillsReportQueryDto,
  UnenrollQueryDto,
  UpdateEnrollmentDto,
  UpdateSessionDto,
  UpdateTrainingDto,
} from './dto/trainings.dto';

const ALL = [Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE];
const MANAGERS = [Role.ADMIN, Role.SST_MANAGER];

// NOTE: static routes (sessions, me, skills-report, auto-plan, enrollments) must stay above ':id'.
@ApiTags('trainings')
@ApiBearerAuth()
@Controller('trainings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingsController {
  constructor(private readonly service: TrainingsService) {}

  // ----- Sessions -----
  @Get('sessions')
  @Roles(...ALL)
  listSessions(@Query() q: ListSessionsQueryDto, @Req() req) {
    return this.service.listSessions(q, req.user.id);
  }

  @Post('sessions')
  @Roles(...MANAGERS)
  createSession(@Body() dto: CreateSessionDto) {
    return this.service.createSession(dto);
  }

  @Get('sessions/:id')
  @Roles(...ALL)
  getSession(@Param('id', ParseIntPipe) id: number) {
    return this.service.findSession(id);
  }

  @Patch('sessions/:id')
  @Roles(...MANAGERS)
  updateSession(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSessionDto) {
    return this.service.updateSession(id, dto);
  }

  @Delete('sessions/:id')
  @Roles(...MANAGERS)
  async removeSession(@Param('id', ParseIntPipe) id: number) {
    await this.service.removeSession(id);
    return { deleted: true };
  }

  @Post('sessions/:id/enroll')
  @Roles(...ALL)
  @HttpCode(201)
  @ApiOperation({ summary: 'Enroll self (managers may pass userId). 409 when full or already enrolled; 400 for past/cancelled sessions.' })
  enroll(@Param('id', ParseIntPipe) id: number, @Body() dto: EnrollDto, @Req() req) {
    return this.service.enroll(id, req.user, dto.userId);
  }

  @Delete('sessions/:id/enroll')
  @Roles(...ALL)
  @ApiOperation({ summary: 'Cancel own enrollment (managers may pass ?userId=)' })
  unenroll(@Param('id', ParseIntPipe) id: number, @Query() q: UnenrollQueryDto, @Req() req) {
    return this.service.unenroll(id, req.user, q.userId);
  }

  @Get('sessions/:id/enrollments')
  @Roles(...MANAGERS)
  listEnrollments(@Param('id', ParseIntPipe) id: number, @Query() q: PaginationDto) {
    return this.service.listSessionEnrollments(id, q);
  }

  // ----- Enrollments / me / reports -----
  @Patch('enrollments/:id')
  @Roles(...MANAGERS)
  @ApiOperation({ summary: 'Set status/score/progress. passed => completedAt=now, expiresAt=completedAt+validityMonths' })
  updateEnrollment(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnrollmentDto) {
    return this.service.updateEnrollment(id, dto);
  }

  @Get('me')
  @Roles(...ALL)
  @ApiOperation({ summary: 'My enrollments with session, training and expiresAt / isExpired / expiresSoon (<= 30 days)' })
  me(@Query() q: MyTrainingsQueryDto, @Req() req) {
    return this.service.myEnrollments(req.user.id, q);
  }

  @Get('skills-report')
  @Roles(...MANAGERS)
  @ApiOperation({ summary: 'C4.3 per user acquired / expiring / missing mandatory trainings (department filter)' })
  skillsReport(@Query() q: SkillsReportQueryDto) {
    return this.service.skillsReport(q.department);
  }

  @Post('auto-plan')
  @Roles(...MANAGERS)
  @HttpCode(200)
  @ApiOperation({ summary: 'C4.1 list users lacking valid mandatory trainings and notify them' })
  autoPlan(@Body() dto: AutoPlanDto) {
    return this.service.autoPlan(dto);
  }

  // ----- Catalogue -----
  @Get()
  @Roles(...ALL)
  list(@Query() q: ListTrainingsQueryDto, @Req() req) {
    return this.service.listTrainings(q, req.user);
  }

  @Post()
  @Roles(...MANAGERS)
  create(@Body() dto: CreateTrainingDto) {
    return this.service.createTraining(dto);
  }

  @Get(':id')
  @Roles(...ALL)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.findTraining(id, req.user);
  }

  @Patch(':id')
  @Roles(...MANAGERS)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrainingDto) {
    return this.service.updateTraining(id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGERS)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.removeTraining(id);
    return { deleted: true };
  }
}
