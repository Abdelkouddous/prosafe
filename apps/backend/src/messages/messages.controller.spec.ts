import { ForbiddenException } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { Role } from '../users/enums/role.enum';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: Record<string, jest.Mock>;

  const req = (roles: Role[], id = 10) => ({ user: { id, roles } });

  beforeEach(() => {
    service = {
      findAll: jest.fn().mockResolvedValue(['all']),
      findAllInvolving: jest.fn().mockResolvedValue(['mine']),
      findOne: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };
    controller = new MessagesController(service as any);
  });

  it('employees only get messages they sent or received', async () => {
    await expect(controller.findAll(req([Role.EMPLOYEE]))).resolves.toEqual(['mine']);
    expect(service.findAllInvolving).toHaveBeenCalledWith(10);
    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('employees cannot use ?all=true', async () => {
    await expect(controller.findAll(req([Role.EMPLOYEE]), 'true')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('managers may use ?all=true', async () => {
    await expect(controller.findAll(req([Role.SST_MANAGER]), 'true')).resolves.toEqual(['all']);
  });

  it("an employee cannot read someone else's message", async () => {
    service.findOne.mockResolvedValue({ id: 1, sender_id: 1, recipient_id: 2 });
    await expect(controller.findOne(1, req([Role.EMPLOYEE], 3))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.findOne(1, req([Role.EMPLOYEE], 2))).resolves.toBeDefined();
  });

  it('employees cannot broadcast', async () => {
    await expect(controller.create({ subject: 's', content: 'c', send_to_all: true }, req([Role.EMPLOYEE]))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
