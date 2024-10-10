import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // call reflector class for implement canActivate function
  constructor(private reflector: Reflector) {}

  // chek guards function
  canActivate(context: ExecutionContext): boolean {
    // get metadata decorator for 'Roles'
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // if required roles not showing return true
    if (!requiredRoles) return true;

    // get user.roles request data
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // call function to compare roles in request user between metadata roles decorator
    return matchRoles(requiredRoles, user.roles);
  }
}

function matchRoles(requiredRoles: string[], userRole: string) {
  return requiredRoles.some((role: string) => userRole.includes(role));
}
