import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MaintenanceResult, MaintenanceStatus, MaintenanceType } from '../enums/maintenance.enums';

export class CreateMaintenanceDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  itemId: number;

  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: '2026-12-01T09:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateMaintenanceDto {
  @ApiPropertyOptional({ enum: MaintenanceType })
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ enum: [MaintenanceStatus.PLANNED, MaintenanceStatus.CANCELLED], description: 'Use /complete to mark as done' })
  @IsOptional()
  @IsIn([MaintenanceStatus.PLANNED, MaintenanceStatus.CANCELLED])
  status?: MaintenanceStatus.PLANNED | MaintenanceStatus.CANCELLED;
}

export class CompleteMaintenanceDto {
  @ApiProperty({ enum: MaintenanceResult })
  @IsEnum(MaintenanceResult)
  result: MaintenanceResult;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Defaults to now' })
  @IsOptional()
  @IsDateString()
  doneAt?: string;

  @ApiPropertyOptional({ description: 'When set, a new planned maintenance (same type) is created and becomes the item nextInspectionAt' })
  @IsOptional()
  @IsDateString()
  nextScheduledAt?: string;
}

export class ListMaintenanceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  itemId?: number;

  @ApiPropertyOptional({ enum: MaintenanceStatus, description: 'status=done is the maintenance history' })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ description: 'scheduledAt >= from' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'scheduledAt <= to (date-only includes the whole day)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
