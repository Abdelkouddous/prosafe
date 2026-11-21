import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { AlertSeverity } from '../enums/alert-severity.enum';
import { AlertType } from '../enums/alert-type.enum';

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ enum: AlertType })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source_ip?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  affected_user_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}