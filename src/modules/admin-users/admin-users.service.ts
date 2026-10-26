import { Injectable } from '@nestjs/common';
import type { UserRole } from '../../common/enums/user-role.enum.js';
import {
  ownRoleChangeError,
  userNotFoundError,
} from '../../common/errors/role-errors.js';
import type { ListUsersQuery } from '../../common/interfaces/list-users-query.interface.js';
import type { Paginated } from '../../common/interfaces/paginated.interface.js';
import type { UserResponse } from '../../common/interfaces/user-response.interface.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AdminUsersService {
  constructor(private readonly usersService: UsersService) {}

  list(query: ListUsersQuery): Promise<Paginated<UserResponse>> {
    return this.usersService.list(query);
  }

  async updateRole(
    actorId: string,
    userId: string,
    role: UserRole,
  ): Promise<UserResponse> {
    if (actorId === userId) {
      throw ownRoleChangeError();
    }
    const user = await this.usersService.updateRole(userId, role);
    if (!user) {
      throw userNotFoundError();
    }
    return user;
  }
}
