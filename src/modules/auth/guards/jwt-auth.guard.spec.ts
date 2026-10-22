import type { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import {
  INVALID_TOKEN_MESSAGE,
  MISSING_MESSAGE,
} from '../../../common/constants/error-messages.constants.js';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface.js';
import { UsersService } from '../../users/users.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const payload = {
    sub: randomUUID(),
    ver: 2,
    iss: 'iss',
    aud: 'aud',
    iat: 1,
    exp: 2,
  };
  const user = { id: payload.sub, tokenVersion: 2 };
  const jwtService = { verifyAsync: vi.fn() };
  const usersService = { findById: vi.fn() };

  const contextFor = (authorization?: string) => {
    const request = { headers: { authorization } } as AuthenticatedRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { request, context };
  };

  const tokenErrorBody = (message: string) => ({
    status: 401,
    response: { errors: { token: [message] } },
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    jwtService.verifyAsync.mockResolvedValue(payload);
    usersService.findById.mockResolvedValue(user);

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    guard = moduleRef.get(JwtAuthGuard);
  });

  it.each(['Bearer abc', 'bearer abc'])(
    'attaches payload and user for %s',
    async (header) => {
      const { request, context } = contextFor(header);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('abc');
      expect(request.auth).toEqual({ payload, user });
    },
  );

  it.each([undefined, '', 'Token abc', 'Bearer', 'Bearer a b'])(
    'rejects header %s as missing',
    async (header) => {
      await expect(
        guard.canActivate(contextFor(header).context),
      ).rejects.toMatchObject(tokenErrorBody(MISSING_MESSAGE));
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    },
  );

  it('rejects a token that fails verification', async () => {
    jwtService.verifyAsync.mockRejectedValueOnce(new Error('bad'));

    await expect(
      guard.canActivate(contextFor('Bearer abc').context),
    ).rejects.toMatchObject(tokenErrorBody(INVALID_TOKEN_MESSAGE));
  });

  it.each([
    { ...payload, sub: 'not-a-uuid' },
    { ...payload, ver: undefined },
    { ...payload, ver: '2' },
  ])('rejects a malformed payload %o', async (malformed) => {
    jwtService.verifyAsync.mockResolvedValueOnce(malformed);

    await expect(
      guard.canActivate(contextFor('Bearer abc').context),
    ).rejects.toMatchObject(tokenErrorBody(INVALID_TOKEN_MESSAGE));
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('rejects a token issued before the last logout', async () => {
    usersService.findById.mockResolvedValueOnce({ ...user, tokenVersion: 3 });

    await expect(
      guard.canActivate(contextFor('Bearer abc').context),
    ).rejects.toMatchObject(tokenErrorBody(INVALID_TOKEN_MESSAGE));
  });

  it('rejects a token whose user no longer exists', async () => {
    usersService.findById.mockResolvedValueOnce(null);

    await expect(
      guard.canActivate(contextFor('Bearer abc').context),
    ).rejects.toMatchObject(tokenErrorBody(INVALID_TOKEN_MESSAGE));
  });
});
