import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { AlertSeverity } from '../enums/alert-severity.enum';
import { AlertType } from '../enums/alert-type.enum';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsEnum(AlertType)
  type: AlertType;

  @IsOptional()
  @IsString()
  source_ip?: string;

  @IsOptional()
  @IsNumber()
  affected_user_id?: number;

  @IsOptional()
  @IsObject()
  metadata?: any;
}