import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDate, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../common/pagination.dto';
import { AuditResult, AuditStatus, AuditType, ComplianceDocumentType } from '../enums/audit.enums';

export class ChecklistItemInputDto {
  @ApiProperty({ example: '4.1' }) @IsString() @IsNotEmpty() @MaxLength(20) clause: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) question: string;
}

export class CreateChecklistTemplateDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @ApiProperty({ example: 'ISO 45001' }) @IsString() @IsNotEmpty() @MaxLength(100) standard: string;
  @ApiProperty({ type: [ChecklistItemInputDto], description: 'Item ids (1..n) are assigned by the server' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(300) @ValidateNested({ each: true }) @Type(() => ChecklistItemInputDto) items: ChecklistItemInputDto[];
}

export class CreateAuditDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiPropertyOptional({ enum: AuditType, default: AuditType.INTERNAL }) @IsOptional() @IsEnum(AuditType) type?: AuditType;
  @ApiPropertyOptional({ description: 'Defaults to the template standard' }) @IsOptional() @IsString() @MaxLength(100) standard?: string;
  @ApiProperty({ description: 'ISO date-time' }) @Type(() => Date) @IsDate() scheduledAt: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) auditorName?: string;
  @ApiPropertyOptional({ description: 'Internal auditor (active non-pending user); notified before the audit' })
  @IsOptional() @Type(() => Number) @IsInt() auditorId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) templateId: number;
}

export class UpdateAuditDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @ApiPropertyOptional({ enum: AuditType }) @IsOptional() @IsEnum(AuditType) type?: AuditType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) standard?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() scheduledAt?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) auditorName?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() auditorId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional({ enum: AuditStatus }) @IsOptional() @IsEnum(AuditStatus) status?: AuditStatus;
}

export class ListAuditsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'scheduledAt >= from (ISO)' }) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ description: 'scheduledAt <= to (ISO; date-only includes the whole day)' }) @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional({ enum: AuditStatus }) @IsOptional() @IsEnum(AuditStatus) status?: AuditStatus;
  @ApiPropertyOptional({ enum: AuditType }) @IsOptional() @IsEnum(AuditType) type?: AuditType;
}

export class AuditResponseInputDto {
  @ApiProperty({ description: 'ChecklistItem.id of the audit template' }) @Type(() => Number) @IsInt() @Min(1) itemId: number;
  @ApiProperty({ enum: AuditResult }) @IsEnum(AuditResult) result: AuditResult;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) comment?: string;
  @ApiPropertyOptional({ description: 'StoredFile id (upload through POST /compliance-documents or an image upload)' })
  @IsOptional() @Type(() => Number) @IsInt() evidenceFileId?: number;
}

export class SubmitAuditResponsesDto {
  @ApiProperty({ type: [AuditResponseInputDto] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(300) @ValidateNested({ each: true }) @Type(() => AuditResponseInputDto) responses: AuditResponseInputDto[];
  @ApiPropertyOptional({ description: 'Create a corrective action (sourceType audit) per non-conform item (once per item)' })
  @IsOptional() @IsBoolean() createActions?: boolean;
  @ApiPropertyOptional({ description: 'Owner of the generated actions (active non-pending user)' })
  @IsOptional() @Type(() => Number) @IsInt() actionOwnerId?: number;
  @ApiPropertyOptional({ description: 'Due date of the generated actions (default: +30 days)' }) @IsOptional() @Type(() => Date) @IsDate() actionDueDate?: Date;
}

// ---------- Compliance documents ----------

export class CreateComplianceDocumentDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiPropertyOptional({ enum: ComplianceDocumentType, default: ComplianceDocumentType.OTHER })
  @IsOptional() @IsEnum(ComplianceDocumentType) type?: ComplianceDocumentType;
  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsDateString({ strict: true }) validUntil?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() auditId?: number;
}

export class ListComplianceDocumentsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: ComplianceDocumentType }) @IsOptional() @IsEnum(ComplianceDocumentType) type?: ComplianceDocumentType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() auditId?: number;
  @ApiPropertyOptional({ description: 'Only documents expiring within 30 days (or already expired)' })
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() expiring?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) search?: string;
}
