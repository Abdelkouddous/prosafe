import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateLmraDto, CreateRiskDto, EvaluateRiskDto, ListLmraQueryDto, ListRisksQueryDto, MatrixQueryDto, UpdateRiskDto } from './dto/risk.dto';
import { RisksService } from './risks.service';

@ApiTags('risks')
@ApiBearerAuth()
@Controller('risks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
export class RisksController {
  constructor(private readonly service: RisksService) {}

  @Get()
  @ApiOperation({ summary: 'Risk catalogue (employees: validated/mitigated + own proposals)' })
  findAll(@Query() q: ListRisksQueryDto, @Req() req) {
    return this.service.findAll(q, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a risk (employee -> proposed, manager -> validated)' })
  create(@Body() dto: CreateRiskDto, @Req() req) {
    return this.service.create(dto, req.user);
  }

  // ---- static routes BEFORE :id ----

  @Get('matrix')
  @ApiOperation({ summary: '5x5 risk matrix: 25 cells { gravity, probability, score, level, count, riskIds }' })
  matrix(@Query() q: MatrixQueryDto, @Req() req) {
    return this.service.matrix(q, req.user);
  }

  @Post('lmra')
  @ApiOperation({ summary: 'Submit a Last Minute Risk Assessment (uncontrolled hazards become proposed risks)' })
  createLmra(@Body() dto: CreateLmraDto, @Req() req) {
    return this.service.createLmra(dto, req.user);
  }

  @Get('lmra')
  @ApiOperation({ summary: 'LMRA history (managers: all, employees: own)' })
  listLmra(@Query() q: ListLmraQueryDto, @Req() req) {
    return this.service.listLmra(q, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Risk with action plans and corrective actions' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRiskDto, @Req() req) {
    return this.service.update(id, dto, req.user);
  }

  @Patch(':id/evaluate')
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @ApiOperation({ summary: 'Set gravity and probability; score and level are recomputed' })
  evaluate(@Param('id', ParseIntPipe) id: number, @Body() dto: EvaluateRiskDto) {
    return this.service.evaluate(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
