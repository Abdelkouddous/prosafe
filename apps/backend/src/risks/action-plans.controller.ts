import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { ActionPlansService } from './action-plans.service';
import { CreateActionPlanDto, ListActionPlansQueryDto, UpdateActionPlanDto } from './dto/risk.dto';

@ApiTags('action-plans')
@ApiBearerAuth()
@Controller('action-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER)
export class ActionPlansController {
  constructor(private readonly service: ActionPlansService) {}

  @Get()
  findAll(@Query() q: ListActionPlansQueryDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateActionPlanDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateActionPlanDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
