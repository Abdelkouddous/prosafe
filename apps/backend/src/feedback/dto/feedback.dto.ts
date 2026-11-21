import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PageQueryDto } from '../../common/pagination.dto';
import { FeedbackCategory } from '../enums/feedback.enums';

export class CreateFeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5) rating: number;
  @ApiProperty({ enum: FeedbackCategory }) @IsEnum(FeedbackCategory) category: FeedbackCategory;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) comment?: string;
  @ApiPropertyOptional({ example: '1.0.0' }) @IsOptional() @IsString() @MaxLength(30) appVersion?: string;
  @ApiPropertyOptional({ example: 'android' }) @IsOptional() @IsString() @MaxLength(30) platform?: string;
}

export class ListFeedbackQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: FeedbackCategory }) @IsOptional() @IsEnum(FeedbackCategory) category?: FeedbackCategory;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
}
