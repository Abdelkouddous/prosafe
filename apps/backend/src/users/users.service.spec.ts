import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from './enums/role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repo: { findOne: jest.Mock; save: jest.Mock; count: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (u) => u),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };
    service = new UsersService(repo as any);
  });

  it('creates users as pending and inactive by default, with a hashed password', async () => {
    const user = await service.create({ email: 'a@b.c', firstName: 'A', lastName: 'B', password: 'Passw0rdX' });
    expect(user.roles).toEqual([Role.PENDING]);
    expect(user.isActive).toBe(false);
    expect(user.password).not.toBe('Passw0rdX');
  });

  it('creates the bootstrap admin active', async () => {
    const user = await service.create({ email: 'a@b.c', firstName: 'A', lastName: 'B', password: 'Passw0rdX' }, Role.ADMIN);
    expect(user.roles).toEqual([Role.ADMIN]);
    expect(user.isActive).toBe(true);
  });

  it('approveUser sets the employee role and activates the account', async () => {
    repo.findOne.mockResolvedValue({ id: 3, roles: [Role.PENDING], isActive: false });
    const user = await service.approveUser(3);
    expect(user.roles).toEqual([Role.EMPLOYEE]);
    expect(user.isActive).toBe(true);
  });

  it('findById throws NotFoundException when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
