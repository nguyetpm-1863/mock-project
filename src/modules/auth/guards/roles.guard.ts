import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_METADATA_KEY } from '../../../common/constants/role.constants.js';
import type { UserRole } from '../../../common/enums/user-role.enum.js';
import { forbiddenError } from '../../../common/errors/role-errors.js';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    const { auth } = context
      .switchToHttp()
      .getRequest<Partial<AuthenticatedRequest>>();
    if (!roles?.length || !auth || !roles.includes(auth.user.role)) {
      throw forbiddenError();
    }
    return true;
  }
}
