import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../custom.decorator';
import { Role } from '../../users/enums/role.enum';

/**
 * Checks `@Roles(...)` metadata against `request.user.roles` (array).
 * Must run after JwtAuthGuard. Throws 403 when the user lacks every required role.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : [];

    if (!requiredRoles.some((role) => userRoles.includes(role))) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
