import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/common/enums/user-role.enum.js';
import { createTestApp } from './support/create-test-app.js';
import { resetState } from './support/reset-state.js';

const USERS_URL = '/api/admin/users';
const PASSWORD = 'Str0ng!Pass';
const FORBIDDEN_BODY = { errors: { resource: ['forbidden'] } };

describe('Admin users (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let admin: { id: string };

  const server = () => app.getHttpServer();
  const createUser = async (email: string, name = 'User') => {
    const { body } = await request(server())
      .post('/api/auth/register')
      .send({ email, name, password: PASSWORD })
      .expect(201);
    return body.user as { id: string; email: string };
  };
  const loginAs = async (email: string) => {
    const { body } = await request(server())
      .post('/api/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return `Bearer ${body.accessToken}`;
  };
  const setRole = (id: string, role: UserRole) =>
    app
      .get(DataSource)
      .query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
  const listUsers = (token: string, query: object = {}) =>
    request(server()).get(USERS_URL).query(query).set('Authorization', token);
  const updateRole = (token: string, id: string, role: string) =>
    request(server())
      .patch(`${USERS_URL}/${id}/role`)
      .set('Authorization', token)
      .send({ role });

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetState(app);
    admin = await createUser('admin@example.com', 'Admin');
    await setRole(admin.id, UserRole.Admin);
    adminToken = await loginAs('admin@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('access control', () => {
    it('registers new accounts as plain users even if a role is sent', async () => {
      const { body } = await request(server())
        .post('/api/auth/register')
        .send({
          email: 'sneaky@example.com',
          name: 'Sneaky',
          password: PASSWORD,
          role: UserRole.Admin,
        })
        .expect(201);

      expect(body.user.role).toBe(UserRole.User);
    });

    it('rejects requests without a token', async () => {
      await request(server()).get(USERS_URL).expect(401);
    });

    it('rejects non-admin users with 403', async () => {
      await createUser('user@example.com');
      const res = await listUsers(await loginAs('user@example.com')).expect(
        403,
      );

      expect(res.body).toEqual(FORBIDDEN_BODY);
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      await createUser('alice@example.com', 'Alice');
      await createUser('bob@example.com', 'Bob 100%');
    });

    it('lists users newest first with pagination meta', async () => {
      const res = await listUsers(adminToken, { limit: 2 }).expect(200);

      expect(res.headers['cache-control']).toContain('no-store');
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
      expect(
        res.body.data.map((user: { email: string }) => user.email),
      ).toEqual(['bob@example.com', 'alice@example.com']);
      expect(JSON.stringify(res.body)).not.toMatch(/password|version/i);
    });

    it('filters by role', async () => {
      const res = await listUsers(adminToken, { role: UserRole.Admin }).expect(
        200,
      );

      expect(res.body.data).toEqual([
        expect.objectContaining({ id: admin.id, role: UserRole.Admin }),
      ]);
    });

    it.each([
      ['an email fragment', 'ALICE@', ['alice@example.com']],
      ['a name fragment', 'bob', ['bob@example.com']],
      ['a literal wildcard', '%', ['bob@example.com']],
    ])('searches by %s', async (_label, keyword, emails) => {
      const res = await listUsers(adminToken, { keyword }).expect(200);

      expect(
        res.body.data.map((user: { email: string }) => user.email),
      ).toEqual(emails);
    });

    it.each([
      { page: 0 },
      { limit: 101 },
      { limit: 'abc' },
      { role: 'root' },
      { keyword: 'x'.repeat(101) },
    ])('rejects invalid query %o with 422', async (query) => {
      await listUsers(adminToken, query).expect(422);
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('promotes a user who gains admin access immediately', async () => {
      const user = await createUser('user@example.com');
      const userToken = await loginAs('user@example.com');

      const res = await updateRole(adminToken, user.id, UserRole.Admin).expect(
        200,
      );

      expect(res.body).toMatchObject({ id: user.id, role: UserRole.Admin });
      await listUsers(userToken).expect(200);
    });

    it('demotes an admin whose existing token loses access immediately', async () => {
      const other = await createUser('other@example.com');
      await setRole(other.id, UserRole.Admin);
      const otherToken = await loginAs('other@example.com');

      await updateRole(adminToken, other.id, UserRole.User).expect(200);

      const res = await listUsers(otherToken).expect(403);
      expect(res.body).toEqual(FORBIDDEN_BODY);
    });

    it('does not let an admin change their own role', async () => {
      const res = await updateRole(adminToken, admin.id, UserRole.User).expect(
        422,
      );

      expect(res.body).toEqual({
        errors: { role: ['cannot change your own role'] },
      });
    });

    it('returns 404 for an unknown user', async () => {
      const res = await updateRole(
        adminToken,
        '00000000-0000-4000-8000-000000000000',
        UserRole.Admin,
      ).expect(404);

      expect(res.body).toEqual({ errors: { user: ['not found'] } });
    });

    it('rejects an id that is not a UUID', async () => {
      await updateRole(adminToken, 'not-a-uuid', UserRole.Admin).expect(400);
    });

    it('rejects an unknown role', async () => {
      const user = await createUser('user@example.com');

      await updateRole(adminToken, user.id, 'root').expect(422);
    });
  });
});
