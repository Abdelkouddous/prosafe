import { IsEnum, IsOptional, IsString, MaxLength, ValidateNested, IsNumber, Min, Max, IsNotEmpty, isDate } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentType } from '../enums/incident-type.enum';
import { IncidentSeverity } from '../enums/incident-severity.enum';

import { Transform } from 'class-transformer';
import type { Timestamp } from 'typeorm';

export class LocationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  long?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  manualAddress?: string;
}

export class CreateIncidentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsEnum(IncidentType)
  type: IncidentType;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @IsNotEmpty()
  @Transform(({ value }) => (value instanceof Date ? value : new Date(value)))
  date: Timestamp;
}
