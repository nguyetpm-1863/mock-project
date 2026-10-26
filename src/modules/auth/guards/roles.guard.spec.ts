import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: vi.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);
  const contextFor = (role?: UserRole) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => (role ? { auth: { user: { role } } } : {}),
      }),
    }) as unknown as ExecutionContext;

  it('allows a user with a required role', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([UserRole.Admin]);

    expect(guard.canActivate(contextFor(UserRole.Admin))).toBe(true);
  });

  it.each([
    ['a user without the role', [UserRole.Admin], UserRole.User],
    ['an unauthenticated request', [UserRole.Admin], undefined],
    ['a route without declared roles', undefined, UserRole.Admin],
    ['a route with an empty role list', [], UserRole.Admin],
  ])('rejects %s with 403', (_label, roles, role) => {
    reflector.getAllAndOverride.mockReturnValueOnce(roles);

    expect(() => guard.canActivate(contextFor(role))).toThrow(
      expect.objectContaining({
        status: 403,
        response: { errors: { resource: ['forbidden'] } },
      }),
    );
  });
});
