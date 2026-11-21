import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateFeedbackDto, ListFeedbackQueryDto } from './dto/feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('feedback')
@ApiBearerAuth()
@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Submit in-app feedback (any role)' })
  create(@Body() dto: CreateFeedbackDto, @Req() req) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  @ApiOperation({ summary: 'Feedback list with averageRating (managers)' })
  findAll(@Query() q: ListFeedbackQueryDto) {
    return this.service.findAll(q);
  }
}
