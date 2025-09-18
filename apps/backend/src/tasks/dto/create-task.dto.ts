export class CreateTaskDto {
  name: string;
  description: string;
  priority: number;
  status: string;
  dueDate: Date;
  assignedTo: string;
  assignedBy: string;
  assignedOn: Date;
}
