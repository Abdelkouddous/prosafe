import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max, MaxLength, IsBoolean } from 'class-validator';
import { TaskStatus } from '../enum/task-status.enum';

/**
 * DTO for updating a training course announcement
 * Admins can update all fields
 */
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentParticipants?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
