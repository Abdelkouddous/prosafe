import { BadRequestException, Controller, Get, Param, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';
import { RolesGuard } from '../auth/strategy/roles.guard';
import { Roles } from '../custom.decorator';
import { Role } from '../users/enums/role.enum';
import { ReportsService } from './reports.service';
import { REPORT_KINDS, ReportKind, ReportQueryDto } from './reports.types';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SST_MANAGER)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  /** PDF or XLSX download. `risks` and `audits` return 400 until Phase 4. */
  @Get(':kind')
  @ApiParam({ name: 'kind', enum: REPORT_KINDS })
  @ApiOkResponse({ description: 'application/pdf or xlsx file (Content-Disposition: attachment)' })
  async download(@Param('kind') kind: string, @Query() q: ReportQueryDto): Promise<StreamableFile> {
    if (!(REPORT_KINDS as readonly string[]).includes(kind)) throw new BadRequestException(`Unknown report kind: ${kind}`);
    const { buffer, filename, contentType } = await this.reports.generate(kind as ReportKind, q);
    return new StreamableFile(buffer, { type: contentType, disposition: `attachment; filename="${filename}"`, length: buffer.length });
  }
}
