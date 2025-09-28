import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, MinLength, MaxLength, Min, IsEnum } from 'class-validator';
import { TaskStatus } from '../enum/task-status.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  priority: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxParticipants?: number;
}

/**
 * DTO for assigning a task to a user
 * Only admin users can assign tasks
 */
export class AssignTaskDto {
  @IsNotEmpty()
  @IsNumber()
  assignedToUserId: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  assignmentNote?: string;
}

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
  @IsString()
  priority?: string;
}
