import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Roles } from '../../custom.decorator';
import { Role } from '../../users/enums/role.enum';

class Dummy {
  @Roles(Role.ADMIN, Role.SST_MANAGER)
  managersOnly() {}

  open() {}
}

const ctx = (handler: () => void, user: any): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => Dummy,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const d = new Dummy();

  it('allows routes without @Roles', () => {
    expect(guard.canActivate(ctx(d.open, { roles: [Role.EMPLOYEE] }))).toBe(true);
  });

  it.each([[Role.ADMIN], [Role.SST_MANAGER]])('allows %s on a managers-only route', (role) => {
    expect(guard.canActivate(ctx(d.managersOnly, { roles: [role] }))).toBe(true);
  });

  it('throws ForbiddenException for an employee', () => {
    expect(() => guard.canActivate(ctx(d.managersOnly, { roles: [Role.EMPLOYEE] }))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when the user has no roles array', () => {
    expect(() => guard.canActivate(ctx(d.managersOnly, {}))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx(d.managersOnly, undefined))).toThrow(ForbiddenException);
  });

  it('matches when the user holds one of several roles', () => {
    expect(guard.canActivate(ctx(d.managersOnly, { roles: [Role.EMPLOYEE, Role.SST_MANAGER] }))).toBe(true);
  });
});
