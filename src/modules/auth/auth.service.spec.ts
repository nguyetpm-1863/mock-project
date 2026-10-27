import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import argon2 from 'argon2';
import { QueryFailedError } from 'typeorm';
import {
  LOGIN_MAX_FAILED_ATTEMPTS,
  PASSWORD_HASH_OPTIONS,
} from '../../common/constants/auth.constants.js';
import { PG_UNIQUE_VIOLATION } from '../../common/constants/database.constants.js';
import { TAKEN_MESSAGE } from '../../common/constants/error-messages.constants.js';
import { UserCreationFailedError } from '../../common/errors/user-creation-failed.error.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import type { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { LoginAttemptsService } from './login-attempts.service.js';
import { PasswordService } from './password.service.js';

const PASSWORD = 'Str0ng!Pass';
const EXPIRES_IN = 3600;

describe('AuthService', () => {
  let service: AuthService;
  let storedUser: User | null;
  let storedHash: string;
  let passwordService: PasswordService;
  const createdAt = new Date('2026-01-01T00:00:00Z');
  const usersService = {
    findByEmailWithPassword: vi.fn(),
    create: vi.fn(),
    incrementTokenVersion: vi.fn(),
    findPasswordHash: vi.fn(),
    updatePassword: vi.fn(),
  };
  const loginAttempts = { recordAttempt: vi.fn(), reset: vi.fn() };
  const jwtService = { signAsync: vi.fn() };

  beforeAll(async () => {
    storedHash = await argon2.hash(PASSWORD, PASSWORD_HASH_OPTIONS);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    storedUser = {
      id: 'user-id',
      email: 'jane@example.com',
      name: 'Jane',
      role: UserRole.User,
      passwordHash: storedHash,
      tokenVersion: 3,
      createdAt,
      updatedAt: createdAt,
    };
    usersService.findByEmailWithPassword.mockImplementation(() =>
      Promise.resolve(storedUser),
    );
    usersService.create.mockImplementation((input: Partial<User>) =>
      Promise.resolve({ ...input, id: 'new-id', tokenVersion: 0, createdAt }),
    );
    loginAttempts.recordAttempt.mockResolvedValue(1);
    loginAttempts.reset.mockResolvedValue(undefined);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: LoginAttemptsService, useValue: loginAttempts },
        PasswordService,
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => ({ jwtExpiresIn: EXPIRES_IN }) },
        },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
    passwordService = moduleRef.get(PasswordService);
    await service.onModuleInit();
  });

  describe('register', () => {
    const input = { email: 'new@example.com', name: 'New', password: PASSWORD };

    it('stores an argon2id hash and returns the user without a token', async () => {
      const result = await service.register(input);

      const [created] = usersService.create.mock.calls[0] as [
        { passwordHash: string },
      ];
      expect(created.passwordHash).toMatch(/^\$argon2id\$/);
      expect(await argon2.verify(created.passwordHash, PASSWORD)).toBe(true);
      expect(result).toEqual({
        user: { id: 'new-id', email: input.email, name: input.name, createdAt },
      });
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('maps a unique violation to 409', async () => {
      usersService.create.mockRejectedValueOnce(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate'), { code: PG_UNIQUE_VIOLATION }),
        ),
      );

      await expect(service.register(input)).rejects.toMatchObject({
        status: 409,
        response: { errors: { email: [TAKEN_MESSAGE] } },
      });
    });

    it('wraps other database errors', async () => {
      usersService.create.mockRejectedValueOnce(new Error('db down'));

      await expect(service.register(input)).rejects.toBeInstanceOf(
        UserCreationFailedError,
      );
    });
  });

  describe('login', () => {
    const credentials = { email: 'jane@example.com', password: PASSWORD };

    it('returns a token bound to the token version and clears attempts', async () => {
      const result = await service.login(credentials);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-id', ver: 3 },
        { expiresIn: EXPIRES_IN },
      );
      expect(result).toEqual({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: EXPIRES_IN,
        user: {
          id: 'user-id',
          email: 'jane@example.com',
          name: 'Jane',
          role: UserRole.User,
          createdAt,
        },
      });
      expect(loginAttempts.reset).toHaveBeenCalledWith(credentials.email, 1);
    });

    it('keeps the attempt counted for a wrong password', async () => {
      await expect(
        service.login({ ...credentials, password: 'Wr0ng!Pass' }),
      ).rejects.toMatchObject({ status: 401 });
      expect(loginAttempts.recordAttempt).toHaveBeenCalledWith(
        credentials.email,
      );
      expect(loginAttempts.reset).not.toHaveBeenCalled();
    });

    it('still verifies a hash for an unknown email', async () => {
      storedUser = null;
      const verifySpy = vi.spyOn(passwordService, 'verify');

      await expect(service.login(credentials)).rejects.toMatchObject({
        status: 401,
      });
      expect(verifySpy).toHaveBeenCalledTimes(1);
    });

    it('allows the last attempt before the lock', async () => {
      loginAttempts.recordAttempt.mockResolvedValueOnce(
        LOGIN_MAX_FAILED_ATTEMPTS,
      );

      await expect(service.login(credentials)).resolves.toBeDefined();
    });

    it('rejects a locked account without touching the database', async () => {
      loginAttempts.recordAttempt.mockResolvedValueOnce(
        LOGIN_MAX_FAILED_ATTEMPTS + 1,
      );
      const verifySpy = vi.spyOn(passwordService, 'verify');

      await expect(service.login(credentials)).rejects.toMatchObject({
        status: 429,
      });
      expect(verifySpy).not.toHaveBeenCalled();
      expect(usersService.findByEmailWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('bumps the token version to revoke every token of the user', async () => {
      await service.logout('user-id');

      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith(
        'user-id',
      );
    });
  });

  describe('changePassword', () => {
    const auth = {
      user: {
        id: 'user-id',
        email: 'jane@example.com',
        name: 'Jane',
        role: UserRole.User,
        createdAt,
      },
      payload: {
        sub: 'user-id',
        ver: 3,
        iss: 'iss',
        aud: 'aud',
        iat: 1,
        exp: 2,
      },
    };
    const input = { currentPassword: PASSWORD, newPassword: 'N3w!Passw0rd' };

    beforeEach(() => {
      usersService.findPasswordHash.mockResolvedValue(storedHash);
      usersService.updatePassword.mockResolvedValue(4);
    });

    it('stores a new hash, bumps the token version and returns a fresh token', async () => {
      const result = await service.changePassword(auth, input);

      const [, currentVersion, newHash] = usersService.updatePassword.mock
        .calls[0] as [string, number, string];
      expect(currentVersion).toBe(3);
      expect(await argon2.verify(newHash, input.newPassword)).toBe(true);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-id', ver: 4 },
        { expiresIn: EXPIRES_IN },
      );
      expect(result.accessToken).toBe('jwt-token');
      expect(loginAttempts.reset).toHaveBeenCalledWith(auth.user.email, 1);
    });

    it('rejects a wrong current password without updating', async () => {
      await expect(
        service.changePassword(auth, {
          ...input,
          currentPassword: 'Wr0ng!Pass',
        }),
      ).rejects.toMatchObject({
        status: 422,
        response: { errors: { currentPassword: ['is incorrect'] } },
      });
      expect(usersService.updatePassword).not.toHaveBeenCalled();
      expect(loginAttempts.reset).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password without counting an attempt', async () => {
      await expect(
        service.changePassword(auth, { ...input, newPassword: PASSWORD }),
      ).rejects.toMatchObject({ status: 422 });
      expect(loginAttempts.recordAttempt).not.toHaveBeenCalled();
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });

    it('locks after too many wrong attempts before reading the hash', async () => {
      loginAttempts.recordAttempt.mockResolvedValueOnce(
        LOGIN_MAX_FAILED_ATTEMPTS + 1,
      );

      await expect(service.changePassword(auth, input)).rejects.toMatchObject({
        status: 429,
      });
      expect(usersService.findPasswordHash).not.toHaveBeenCalled();
    });

    it('rejects the token when the user is gone before the hash lookup', async () => {
      usersService.findPasswordHash.mockResolvedValueOnce(null);

      await expect(service.changePassword(auth, input)).rejects.toMatchObject({
        status: 401,
      });
    });

    it('rejects the token when its version changed before the update', async () => {
      usersService.updatePassword.mockResolvedValueOnce(null);

      await expect(service.changePassword(auth, input)).rejects.toMatchObject({
        status: 401,
      });
    });
  });
});
