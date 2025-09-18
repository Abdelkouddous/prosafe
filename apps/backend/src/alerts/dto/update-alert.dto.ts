import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { AlertStatus } from '../enums/alert-status.enum';

export class UpdateAlertDto {
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsNumber()
  resolved_by_id?: number;
}