import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: { findOne: jest.Mock };
  let userRepo: { findOne: jest.Mock };

  beforeEach(() => {
    taskRepo = { findOne: jest.fn() };
    userRepo = { findOne: jest.fn() };
    service = new TasksService(taskRepo as any, userRepo as any);
  });

  it('findOne throws NotFoundException for an unknown task', async () => {
    taskRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create throws NotFoundException when the creator does not exist', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.create({ title: 't', description: 'd', priority: 'high' }, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});
