export enum Role {
  ADMIN = 'admin',
  SST_MANAGER = 'sst_manager',
  EMPLOYEE = 'employee',
  PENDING = 'pending',
}

/** Roles allowed to manage SST data (admin web back-office). */
export const MANAGER_ROLES: Role[] = [Role.ADMIN, Role.SST_MANAGER];
