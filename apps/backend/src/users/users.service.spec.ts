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

  it('list: selects no password, filters by role/search and paginates', async () => {
    const qb: any = {};
    for (const m of ['select', 'orderBy', 'addOrderBy', 'skip', 'take', 'andWhere']) qb[m] = jest.fn().mockReturnValue(qb);
    qb.getManyAndCount = jest.fn().mockResolvedValue([[{ id: 1 }], 1]);
    repo.createQueryBuilder.mockReturnValue(qb);
    const res = await service.list({ role: Role.EMPLOYEE, search: 'ali', department: 'Prod', page: 2, limit: 10 });
    expect(res).toEqual({ data: [{ id: 1 }], total: 1, page: 2, limit: 10 });
    expect(qb.select.mock.calls[0][0]).not.toContain('u.password');
    expect(qb.select.mock.calls[0][0]).toEqual(expect.arrayContaining(['u.id', 'u.roles', 'u.department', 'u.zone', 'u.isActive']));
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(qb.andWhere).toHaveBeenCalledTimes(3);
  });
});
