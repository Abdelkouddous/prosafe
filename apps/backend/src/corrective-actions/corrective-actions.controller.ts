import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CreateCorrectiveActionDto, ListCorrectiveActionsQueryDto, UpdateCorrectiveActionDto } from './dto/corrective-action.dto';

@ApiTags('corrective-actions')
@ApiBearerAuth()
@Controller('corrective-actions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CorrectiveActionsController {
  constructor(private readonly service: CorrectiveActionsService) {}

  /** Managers: all actions. Employees: only the ones they own. */
  @Get()
  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  findAll(@Query() q: ListCorrectiveActionsQueryDto, @Req() req) {
    return this.service.findAll(q, req.user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.findOne(id, req.user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  create(@Body() dto: CreateCorrectiveActionDto, @Req() req) {
    return this.service.create(dto, req.user);
  }

  /** Managers: any field. Owner: `status` only. */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCorrectiveActionDto, @Req() req) {
    return this.service.update(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
