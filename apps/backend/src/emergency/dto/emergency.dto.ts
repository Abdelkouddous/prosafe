import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../common/pagination.dto';
import { DrillStatus, EmergencyScenarioType } from '../enums/emergency.enums';

export class EmergencyContactDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) role: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50) phone: string;
}

export class CreateScenarioDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiProperty({ enum: EmergencyScenarioType }) @IsEnum(EmergencyScenarioType) type: EmergencyScenarioType;
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) @MaxLength(1000, { each: true }) steps: string[];
  @ApiPropertyOptional({ type: [EmergencyContactDto] })
  @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => EmergencyContactDto) contacts?: EmergencyContactDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) assemblyPoint?: string;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateScenarioDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @ApiPropertyOptional({ enum: EmergencyScenarioType }) @IsOptional() @IsEnum(EmergencyScenarioType) type?: EmergencyScenarioType;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) @MaxLength(1000, { each: true }) steps?: string[];
  @ApiPropertyOptional({ type: [EmergencyContactDto] })
  @IsOptional() @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => EmergencyContactDto) contacts?: EmergencyContactDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) assemblyPoint?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ListScenariosQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: EmergencyScenarioType }) @IsOptional() @IsEnum(EmergencyScenarioType) type?: EmergencyScenarioType;
  @ApiPropertyOptional({ description: 'Employees only ever get active scenarios' })
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() active?: boolean;
}

export class TriggerEmergencyDto {
  @ApiPropertyOptional({ description: 'Predefined scenario (must be active)' }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) scenarioId?: number;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(1000) message: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
}

export class ListEventsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'true: only ongoing events; false: only closed' })
  @IsOptional() @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true')) @IsBoolean() active?: boolean;
}

export class CreateDrillDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) scenarioId?: number;
  @ApiProperty({ description: 'ISO date-time' }) @Type(() => Date) @IsDate() scheduledAt: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
}

export class UpdateDrillDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) scenarioId?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() scheduledAt?: Date;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional({ enum: DrillStatus }) @IsOptional() @IsEnum(DrillStatus) status?: DrillStatus;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) durationSeconds?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) participantsCount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) evacuatedCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) observations?: string;
}

export class ListDrillsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: DrillStatus }) @IsOptional() @IsEnum(DrillStatus) status?: DrillStatus;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() from?: Date;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() to?: Date;
}
