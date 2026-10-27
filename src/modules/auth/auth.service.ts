import { ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import {
  AUTH_SCHEME,
  LOGIN_MAX_FAILED_ATTEMPTS,
  UNKNOWN_USER_SECRET_BYTES,
} from '../../common/constants/auth.constants.js';
import { KEY_HASH_ENCODING } from '../../common/constants/crypto.constants.js';
import {
  INVALID_TOKEN_MESSAGE,
  TAKEN_MESSAGE,
} from '../../common/constants/error-messages.constants.js';
import { isUniqueViolation } from '../../common/database/is-unique-violation.js';
import { apiErrors } from '../../common/errors/api-errors.js';
import {
  credentialsError,
  loginLockedError,
  tokenError,
} from '../../common/errors/auth-errors.js';
import {
  currentPasswordError,
  samePasswordError,
} from '../../common/errors/password-errors.js';
import { UserCreationFailedError } from '../../common/errors/user-creation-failed.error.js';
import type { AuthContext } from '../../common/interfaces/auth-context.interface.js';
import type { AuthResponse } from '../../common/interfaces/auth-response.interface.js';
import type { RegisterResponse } from '../../common/interfaces/register-response.interface.js';
import type { TokenSubject } from '../../common/interfaces/token-subject.interface.js';
import { toUserResponse } from '../../common/mappers/user.mapper.js';
import type { AuthConfig } from '../../common/interfaces/auth-config.interface.js';
import { UsersService } from '../users/users.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginAttemptsService } from './login-attempts.service.js';
import { PasswordService } from './password.service.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private unknownUserHash: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginAttempts: LoginAttemptsService,
    private readonly passwordService: PasswordService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.unknownUserHash = await this.passwordService.hash(
      randomBytes(UNKNOWN_USER_SECRET_BYTES).toString(KEY_HASH_ENCODING),
    );
  }

  async register({
    email,
    name,
    password,
  }: RegisterDto): Promise<RegisterResponse> {
    const passwordHash = await this.passwordService.hash(password);
    const user = await this.usersService
      .create({ email, name, passwordHash })
      .catch((error: unknown) => this.handleCreateError(error));
    return { user: toUserResponse(user) };
  }

  async login({ email, password }: LoginDto): Promise<AuthResponse> {
    const attempts = await this.loginAttempts.recordAttempt(email);
    if (attempts > LOGIN_MAX_FAILED_ATTEMPTS) {
      throw loginLockedError();
    }

    const user = await this.usersService.findByEmailWithPassword(email);
    const isPasswordValid = await this.passwordService.verify(
      user?.passwordHash ?? this.unknownUserHash,
      password,
    );
    if (!user || !isPasswordValid) {
      throw credentialsError();
    }

    const [response] = await Promise.all([
      this.buildAuthResponse(user),
      this.loginAttempts.reset(email, attempts),
    ]);
    return response;
  }

  async changePassword(
    { user, payload }: AuthContext,
    { currentPassword, newPassword }: ChangePasswordDto,
  ): Promise<AuthResponse> {
    if (newPassword === currentPassword) {
      throw samePasswordError();
    }
    const attempts = await this.loginAttempts.recordAttempt(user.email);
    if (attempts > LOGIN_MAX_FAILED_ATTEMPTS) {
      throw loginLockedError();
    }

    const passwordHash = await this.usersService.findPasswordHash(user.id);
    if (!passwordHash) {
      throw tokenError(INVALID_TOKEN_MESSAGE);
    }
    const isPasswordValid = await this.passwordService.verify(
      passwordHash,
      currentPassword,
    );
    if (!isPasswordValid) {
      throw currentPasswordError();
    }

    const tokenVersion = await this.usersService.updatePassword(
      user.id,
      payload.ver,
      await this.passwordService.hash(newPassword),
    );
    if (tokenVersion === null) {
      throw tokenError(INVALID_TOKEN_MESSAGE);
    }
    const [response] = await Promise.all([
      this.buildAuthResponse({ ...user, tokenVersion }),
      this.loginAttempts.reset(user.email, attempts),
    ]);
    return response;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.incrementTokenVersion(userId);
  }

  private handleCreateError(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw new ConflictException(apiErrors({ email: [TAKEN_MESSAGE] }));
    }
    throw new UserCreationFailedError(error);
  }

  private async buildAuthResponse(user: TokenSubject): Promise<AuthResponse> {
    const { jwtExpiresIn } = this.configService.getOrThrow<AuthConfig>('auth');
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, ver: user.tokenVersion },
      { expiresIn: jwtExpiresIn },
    );
    return {
      accessToken,
      tokenType: AUTH_SCHEME,
      expiresIn: jwtExpiresIn,
      user: toUserResponse(user),
    };
  }
}
