import { IsEnum } from 'class-validator';
import { IncidentStatus } from '../enums/incident-status.enum';

export class UpdateIncidentStatusDto {
  @IsEnum(IncidentStatus)
  status: IncidentStatus;
}