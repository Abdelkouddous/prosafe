import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IncidentSeverity } from '../enums/incident-severity.enum';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentType } from '../enums/incident-type.enum';

export class ListIncidentsQueryDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;

  @ApiPropertyOptional({ enum: IncidentStatus }) @IsOptional() @IsEnum(IncidentStatus) status?: IncidentStatus;
  @ApiPropertyOptional({ enum: IncidentType }) @IsOptional() @IsEnum(IncidentType) type?: IncidentType;
  @ApiPropertyOptional({ enum: IncidentSeverity }) @IsOptional() @IsEnum(IncidentSeverity) severity?: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Incident date >= from (ISO date or date-time)' }) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ description: 'Incident date <= to (a date-only value includes the whole day)' }) @IsOptional() @IsDateString() to?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) department?: string;
  @ApiPropertyOptional({ description: 'ILIKE on description, manualAddress, incidentId' }) @IsOptional() @IsString() @MaxLength(100) search?: string;

  @ApiPropertyOptional({ description: 'Managers only (ignored for employees)' }) @IsOptional() @Type(() => Number) @IsInt() reporterId?: number;

  @ApiPropertyOptional({ description: 'Requires lng and radiusKm' }) @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) lat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) lng?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(20000) radiusKm?: number;
}
