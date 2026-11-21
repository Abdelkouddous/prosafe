import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { CleanupUploadsOnErrorInterceptor } from '../files/cleanup-uploads.interceptor';
import { buildMulterOptions } from '../files/upload.config';
import { Role } from '../users/enums/role.enum';
import { AuditsService } from './audits.service';
import { ComplianceDocumentsService } from './compliance-documents.service';
import {
  CreateAuditDto, CreateChecklistTemplateDto, CreateComplianceDocumentDto, ListAuditsQueryDto, ListComplianceDocumentsQueryDto,
  SubmitAuditResponsesDto, UpdateAuditDto,
} from './dto/audit.dto';

@ApiTags('audits')
@ApiBearerAuth()
@Controller('audits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER)
export class AuditsController {
  constructor(private readonly service: AuditsService) {}

  // ---- static routes BEFORE :id ----

  @Get('templates')
  @ApiOperation({ summary: 'Checklist templates (seeded: ISO 45001:2018)' })
  listTemplates() {
    return this.service.listTemplates();
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateChecklistTemplateDto, @Req() req) {
    return this.service.createTemplate(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Audit calendar (filters from, to, status, type; sorted by scheduledAt)' })
  findAll(@Query() q: ListAuditsQueryDto) {
    return this.service.findAll(q);
  }

  @Post()
  create(@Body() dto: CreateAuditDto, @Req() req) {
    return this.service.create(dto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Audit with template items, responses, summary and corrective actions' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAuditDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/responses')
  @ApiOperation({ summary: 'Upsert checklist responses, recompute the score; createActions generates corrective actions' })
  submitResponses(@Param('id', ParseIntPipe) id: number, @Body() dto: SubmitAuditResponsesDto, @Req() req) {
    return this.service.submitResponses(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

@ApiTags('compliance-documents')
@ApiBearerAuth()
@Controller('compliance-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER)
export class ComplianceDocumentsController {
  constructor(private readonly service: ComplianceDocumentsService) {}

  @Get()
  findAll(@Query() q: ListComplianceDocumentsQueryDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /** Multipart: field `file` (pdf, docx, xlsx, jpg/png/webp; <= 20 MB for documents, 10 MB for images) + DTO fields. */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        type: { type: 'string', enum: ['audit_report', 'certificate', 'procedure', 'policy', 'other'] },
        validUntil: { type: 'string', format: 'date' },
        auditId: { type: 'integer' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', buildMulterOptions(['document', 'image'], 1)), CleanupUploadsOnErrorInterceptor)
  create(@Body() dto: CreateComplianceDocumentDto, @UploadedFile() file: Express.Multer.File, @Req() req) {
    return this.service.create(dto, file, req.user);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
