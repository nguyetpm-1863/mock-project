import { Injectable } from '@nestjs/common';
import { INVALID_TOKEN_MESSAGE } from '../../common/constants/error-messages.constants.js';
import { tokenError } from '../../common/errors/auth-errors.js';
import type { UserResponse } from '../../common/interfaces/user-response.interface.js';
import { toUserResponse } from '../../common/mappers/user.mapper.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class ProfileService {
  constructor(private readonly usersService: UsersService) {}

  async updateName(user: UserResponse, name: string): Promise<UserResponse> {
    const updated = await this.usersService.updateName(user.id, name);
    if (!updated) {
      throw tokenError(INVALID_TOKEN_MESSAGE);
    }
    return toUserResponse({ ...user, name });
  }
}
