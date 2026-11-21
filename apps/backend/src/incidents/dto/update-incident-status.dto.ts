import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IncidentStatus } from '../enums/incident-status.enum';

export class UpdateIncidentStatusDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @ApiPropertyOptional({ description: 'Comment stored in the incident history' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({ deprecated: true, description: 'Legacy alias of `comment`' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Only with status `closed`: the report is rejected and the reporter\'s reward points are revoked' })
  @IsOptional()
  @IsBoolean()
  rejected?: boolean;
}
