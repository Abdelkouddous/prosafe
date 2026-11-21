import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateNested, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentType } from '../enums/incident-type.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';

import { Transform } from 'class-transformer';

/** Legacy nested location (JSON clients). Multipart clients use the flat latitude/longitude/manualAddress fields. */
export class LocationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @ApiPropertyOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @ApiPropertyOptional()
  @IsNumber()
  long?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manualAddress?: string;
}

const toNumber = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? value : num;
};

export class CreateIncidentDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  type: IncidentType;

  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Incident date (defaults to now)' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined || value === null ? undefined : value instanceof Date ? value : new Date(value)))
  @IsDate()
  date?: Date;

  @ApiPropertyOptional() @IsOptional() @Transform(toNumber) @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(toNumber) @IsNumber() longitude?: number;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manualAddress?: string;

  @ApiPropertyOptional({ maxLength: 100 }) @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional({ maxLength: 100 }) @IsOptional() @IsString() @MaxLength(100) department?: string;

  @ApiPropertyOptional({ type: () => LocationDto, deprecated: true, description: 'Legacy nested location; prefer latitude/longitude/manualAddress' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Up to 5 images/videos (multipart field `media`)' })
  media?: any[];
}
