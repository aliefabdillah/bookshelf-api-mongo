import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
// Create New Decorator named 'Roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
