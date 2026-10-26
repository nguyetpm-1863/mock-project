import { SetMetadata } from '@nestjs/common';
import { ROLES_METADATA_KEY } from '../constants/role.constants.js';
import type { UserRole } from '../enums/user-role.enum.js';

export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_METADATA_KEY, roles);
