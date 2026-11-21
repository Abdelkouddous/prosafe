import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IncidentSeverity } from '../enums/incident-severity.enum';

export class EvaluateIncidentDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) gravity: number;
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) probability: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) rootCause?: string;
  @ApiPropertyOptional({ enum: IncidentSeverity, description: 'Severity retained by the manager (the reporter-chosen `severity` is kept)' })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  evaluatedSeverity?: IncidentSeverity;
}
