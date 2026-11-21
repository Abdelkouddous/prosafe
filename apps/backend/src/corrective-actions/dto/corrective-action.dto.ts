import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PageQueryDto } from '../../common/pagination.dto';
import { CorrectiveActionSource, CorrectiveActionStatus } from '../enums/corrective-action.enums';

export class CreateCorrectiveActionDto {
  @ApiProperty({ enum: CorrectiveActionSource }) @IsEnum(CorrectiveActionSource) sourceType: CorrectiveActionSource;
  @ApiProperty({ description: 'incident.id (numeric id, existence is checked), risk.id or audit.id' })
  @Type(() => Number) @IsInt() @Min(1) sourceId: number;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ description: 'Responsible user (must be an active, non-pending user)' })
  @IsOptional() @Type(() => Number) @IsInt() ownerId?: number;
  @ApiPropertyOptional({ description: 'ISO date or date-time' }) @IsOptional() @Type(() => Date) @IsDate() dueDate?: Date;
}

export class UpdateCorrectiveActionDto extends PartialType(OmitType(CreateCorrectiveActionDto, ['sourceType', 'sourceId'] as const)) {
  @ApiPropertyOptional({ enum: CorrectiveActionStatus }) @IsOptional() @IsEnum(CorrectiveActionStatus) status?: CorrectiveActionStatus;
}

export class ListCorrectiveActionsQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: CorrectiveActionSource }) @IsOptional() @IsEnum(CorrectiveActionSource) sourceType?: CorrectiveActionSource;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sourceId?: number;
  @ApiPropertyOptional({ enum: CorrectiveActionStatus }) @IsOptional() @IsEnum(CorrectiveActionStatus) status?: CorrectiveActionStatus;
  @ApiPropertyOptional({ description: 'Managers only (employees always see their own)' }) @IsOptional() @Type(() => Number) @IsInt() ownerId?: number;
}
