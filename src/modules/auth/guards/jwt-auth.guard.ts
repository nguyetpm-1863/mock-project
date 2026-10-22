import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { AUTH_SCHEME } from '../../../common/constants/auth.constants.js';
import {
  INVALID_TOKEN_MESSAGE,
  MISSING_MESSAGE,
} from '../../../common/constants/error-messages.constants.js';
import { tokenError } from '../../../common/errors/auth-errors.js';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface.js';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface.js';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request.headers.authorization);
    if (!token) {
      throw tokenError(MISSING_MESSAGE);
    }

    const payload = await this.jwtService
      .verifyAsync<JwtPayload>(token)
      .catch(() => null);
    if (!this.isValidPayload(payload)) {
      throw tokenError(INVALID_TOKEN_MESSAGE);
    }

    const user = await this.usersService.findById(payload.sub);
    if (user?.tokenVersion !== payload.ver) {
      throw tokenError(INVALID_TOKEN_MESSAGE);
    }

    request.auth = { payload, user };
    return true;
  }

  private extractToken(header: string | undefined): string | undefined {
    const [scheme, token, ...rest] = header?.split(' ') ?? [];
    const isBearer = scheme?.toLowerCase() === AUTH_SCHEME.toLowerCase();
    return isBearer && token && rest.length === 0 ? token : undefined;
  }

  private isValidPayload(payload: JwtPayload | null): payload is JwtPayload {
    return (
      payload !== null && isUUID(payload.sub) && Number.isInteger(payload.ver)
    );
  }
}
