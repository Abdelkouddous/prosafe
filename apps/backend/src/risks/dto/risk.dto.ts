import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { PageQueryDto } from '../../common/pagination.dto';
import { ActionPlanStatus, LmraDecision, RiskLevel, RiskStatus } from '../enums/risk.enums';

export class CreateRiskDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiProperty({ description: 'Free category, e.g. chute, électrique, chimique, incendie, ergonomie' })
  @IsString() @IsNotEmpty() @MaxLength(100) hazardCategory: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) department?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 3 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) gravity?: number;
  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 3 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) probability?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) recommendedMeasures?: string;
}

export class UpdateRiskDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) hazardCategory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) recommendedMeasures?: string;
  @ApiPropertyOptional({ enum: RiskStatus }) @IsOptional() @IsEnum(RiskStatus) status?: RiskStatus;
}

export class EvaluateRiskDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5) gravity: number;
  @ApiProperty({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5) probability: number;
}

export class ListRisksQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: RiskStatus }) @IsOptional() @IsEnum(RiskStatus) status?: RiskStatus;
  @ApiPropertyOptional({ enum: RiskLevel }) @IsOptional() @IsEnum(RiskLevel) level?: RiskLevel;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) hazardCategory?: string;
  @ApiPropertyOptional({ description: 'Matches title or description' }) @IsOptional() @IsString() @MaxLength(100) search?: string;
}

export class MatrixQueryDto {
  @ApiPropertyOptional({ enum: RiskStatus, description: 'Default: validated' }) @IsOptional() @IsEnum(RiskStatus) status?: RiskStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) zone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) hazardCategory?: string;
}

// ---------- Action plans ----------

export class CreateActionPlanDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) riskId: number;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ description: 'Active, non-pending user' }) @IsOptional() @Type(() => Number) @IsInt() ownerId?: number;
  @ApiPropertyOptional({ description: 'ISO date or date-time' }) @IsOptional() @Type(() => Date) @IsDate() dueDate?: Date;
  @ApiPropertyOptional({ enum: ActionPlanStatus }) @IsOptional() @IsEnum(ActionPlanStatus) status?: ActionPlanStatus;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) progress?: number;
}

export class UpdateActionPlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() ownerId?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() dueDate?: Date;
  @ApiPropertyOptional({ enum: ActionPlanStatus }) @IsOptional() @IsEnum(ActionPlanStatus) status?: ActionPlanStatus;
  @ApiPropertyOptional({ minimum: 0, maximum: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) progress?: number;
}

export class ListActionPlansQueryDto extends PageQueryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() riskId?: number;
  @ApiPropertyOptional({ enum: ActionPlanStatus }) @IsOptional() @IsEnum(ActionPlanStatus) status?: ActionPlanStatus;
}

// ---------- LMRA ----------

export class LmraHazardDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) label: string;
  @ApiProperty() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() present: boolean;
  @ApiProperty() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() controlled: boolean;
}

export class CreateLmraDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) task: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) location?: string;
  @ApiProperty({ type: [LmraHazardDto] })
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => LmraHazardDto) hazards: LmraHazardDto[];
  @ApiProperty({ enum: LmraDecision }) @IsEnum(LmraDecision) decision: LmraDecision;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) comments?: string;
}

export class ListLmraQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: LmraDecision }) @IsOptional() @IsEnum(LmraDecision) decision?: LmraDecision;
  @ApiPropertyOptional({ description: 'Managers only' }) @IsOptional() @Type(() => Number) @IsInt() userId?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() from?: Date;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() to?: Date;
}
