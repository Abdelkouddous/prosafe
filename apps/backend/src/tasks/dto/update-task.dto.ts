import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  user: string;
  user_id: number;
  user_name: string;
  user_email: string;
}
