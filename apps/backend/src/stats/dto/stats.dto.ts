import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const GROUP_BY = ['month', 'type', 'severity', 'zone', 'department', 'status'] as const;
export type GroupBy = (typeof GROUP_BY)[number];

export class PeriodQueryDto {
  @ApiPropertyOptional({ description: 'Incident date >= from (ISO date or date-time)' }) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ description: 'Incident date <= to (a date-only value includes the whole day)' }) @IsOptional() @IsDateString() to?: string;
}

export class IncidentsStatsQueryDto extends PeriodQueryDto {
  @ApiPropertyOptional({ enum: GROUP_BY, default: 'month' }) @IsOptional() @IsIn(GROUP_BY) groupBy?: GroupBy = 'month';
}

export class ForecastQueryDto {
  @ApiPropertyOptional({ default: 3, minimum: 1, maximum: 12 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) months?: number = 3;
}
