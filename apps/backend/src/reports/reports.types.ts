import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const REPORT_KINDS = ['incidents', 'equipment', 'trainings', 'risks', 'audits'] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];
export const REPORT_FORMATS = ['pdf', 'xlsx'] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: REPORT_FORMATS, default: 'pdf' }) @IsOptional() @IsIn(REPORT_FORMATS) format?: ReportFormat = 'pdf';
  @ApiPropertyOptional({ description: 'Period start (ISO date)' }) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ description: 'Period end (ISO date; date-only includes the whole day)' }) @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional({ description: 'incidents: incident type; equipment: category; trainings: training category; risks: hazard category; audits: internal|external' })
  @IsOptional() @IsString() @MaxLength(60) type?: string;
  @ApiPropertyOptional({ description: 'incidents and trainings only' }) @IsOptional() @IsString() @MaxLength(100) department?: string;
}

export interface ReportColumn {
  header: string;
  /** relative width weight */
  width: number;
}

/** Format-agnostic report content, rendered to PDF or XLSX. */
export interface ReportData {
  kind: ReportKind;
  /** e.g. "Rapport des incidents" (the PDF title is prefixed with "PROSAFE — ") */
  title: string;
  periodLabel: string;
  filters: string[];
  summary: [string, string | number][];
  columns: ReportColumn[];
  rows: (string | number)[][];
  truncated: boolean;
}
