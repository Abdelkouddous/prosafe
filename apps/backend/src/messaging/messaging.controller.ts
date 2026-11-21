import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { CreateConversationDto, ListConversationsQueryDto, ListMessagesQueryDto, SendMessageDto } from './dto/conversation.dto';
import { MessagingService } from './messaging.service';

/** Conversations (A2). Every endpoint is restricted to the conversation's participants (managers included). */
@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER, Role.EMPLOYEE)
export class MessagingController {
  constructor(private readonly service: MessagingService) {}

  @Get()
  findAll(@Query() q: ListConversationsQueryDto, @Req() req) {
    return this.service.findAll(q, req.user);
  }

  @Post()
  create(@Body() dto: CreateConversationDto, @Req() req) {
    return this.service.create(dto, req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.findOne(id, req.user);
  }

  @Get(':id/messages')
  listMessages(@Param('id', ParseIntPipe) id: number, @Query() q: ListMessagesQueryDto, @Req() req) {
    return this.service.listMessages(id, q, req.user);
  }

  @Post(':id/messages')
  postMessage(@Param('id', ParseIntPipe) id: number, @Body() dto: SendMessageDto, @Req() req) {
    return this.service.postMessage(id, dto.body, req.user);
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.service.markRead(id, req.user);
  }
}
