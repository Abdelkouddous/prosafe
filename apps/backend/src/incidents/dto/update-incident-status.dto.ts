import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
}
