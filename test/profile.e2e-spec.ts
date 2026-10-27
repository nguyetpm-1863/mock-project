import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { LOGIN_MAX_FAILED_ATTEMPTS } from '../src/common/constants/auth.constants.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { createTestApp } from './support/create-test-app.js';
import { resetState } from './support/reset-state.js';

const ME_URL = '/api/me';
const PASSWORD_URL = '/api/me/password';
const PASSWORD = 'Str0ng!Pass';
const NEW_PASSWORD = 'N3w!Passw0rd';
const WRONG_CHANGE = {
  currentPassword: 'Wr0ng!Pass',
  newPassword: NEW_PASSWORD,
};
const account = { email: 'jane@example.com', name: 'Jane', password: PASSWORD };

describe('Profile (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  const server = () => app.getHttpServer();
  const login = (password = PASSWORD) =>
    request(server())
      .post('/api/auth/login')
      .send({ email: account.email, password });
  const bearer = async (password = PASSWORD) =>
    `Bearer ${(await login(password).expect(200)).body.accessToken}`;
  const changePassword = (authorization: string, body: object) =>
    request(server())
      .patch(PASSWORD_URL)
      .set('Authorization', authorization)
      .send(body);
  const failChanges = async (times: number) => {
    for (let attempt = 0; attempt < times; attempt++) {
      await changePassword(token, WRONG_CHANGE).expect(422);
    }
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetState(app);
    await request(server())
      .post('/api/auth/register')
      .send(account)
      .expect(201);
    token = await bearer();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['GET', ME_URL],
    ['PATCH', ME_URL],
    ['PATCH', PASSWORD_URL],
  ])('requires a token for %s %s', async (method, url) => {
    await request(server())
      [method.toLowerCase() as 'get' | 'patch'](url)
      .expect(401);
  });

  describe('GET /api/me', () => {
    it('returns the public profile', async () => {
      const res = await request(server())
        .get(ME_URL)
        .set('Authorization', token)
        .expect(200);

      expect(res.headers['cache-control']).toContain('no-store');
      expect(res.body).toEqual({
        id: expect.any(String),
        email: account.email,
        name: account.name,
        role: 'user',
        createdAt: expect.any(String),
      });
    });
  });

  describe('PATCH /api/me', () => {
    it('updates the trimmed name and ignores other fields', async () => {
      const res = await request(server())
        .patch(ME_URL)
        .set('Authorization', token)
        .send({
          name: '  Jane Doe ',
          email: 'hacker@example.com',
          role: 'admin',
        })
        .expect(200);

      expect(res.body).toMatchObject({
        email: account.email,
        name: 'Jane Doe',
        role: 'user',
      });
      const me = await request(server())
        .get(ME_URL)
        .set('Authorization', token);
      expect(me.body).toMatchObject({
        email: account.email,
        name: 'Jane Doe',
        role: 'user',
      });
    });

    it.each([
      {},
      { name: '   ' },
      { name: 'x'.repeat(101) },
      { name: 'Jane\u0007' },
    ])('rejects %o with 422', async (body) => {
      await request(server())
        .patch(ME_URL)
        .set('Authorization', token)
        .send(body)
        .expect(422);
    });

    it('rejects the token of a deleted user', async () => {
      await app.get(DataSource).query('DELETE FROM users');

      await request(server())
        .patch(ME_URL)
        .set('Authorization', token)
        .send({ name: 'Ghost' })
        .expect(401);
    });
  });

  describe('PATCH /api/me/password', () => {
    it('changes the password, signs out other devices and returns a new token', async () => {
      const otherDevice = await bearer();

      const res = await changePassword(token, {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      }).expect(200);

      expect(res.body).toMatchObject({
        tokenType: 'Bearer',
        user: { email: account.email },
      });
      for (const oldToken of [token, otherDevice]) {
        await request(server())
          .get(ME_URL)
          .set('Authorization', oldToken)
          .expect(401);
      }
      await request(server())
        .get(ME_URL)
        .set('Authorization', `Bearer ${res.body.accessToken}`)
        .expect(200);
      await login(PASSWORD).expect(401);
      await login(NEW_PASSWORD).expect(200);
    });

    it('rejects a wrong current password', async () => {
      const res = await changePassword(token, WRONG_CHANGE).expect(422);

      expect(res.body).toEqual({
        errors: { currentPassword: ['is incorrect'] },
      });
      await login(PASSWORD).expect(200);
    });

    it('locks both password change and login after too many wrong current passwords', async () => {
      await failChanges(LOGIN_MAX_FAILED_ATTEMPTS);

      await changePassword(token, {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      }).expect(429);
      await login(PASSWORD).expect(429);
    });

    it.each([
      [{ currentPassword: PASSWORD, newPassword: PASSWORD }, 'newPassword'],
      [{ currentPassword: PASSWORD, newPassword: 'weakpass' }, 'newPassword'],
      [{ newPassword: NEW_PASSWORD }, 'currentPassword'],
    ])('rejects %o with 422', async (body, field) => {
      const res = await changePassword(token, body).expect(422);

      expect(Object.keys(res.body.errors)).toContain(field);
    });

    it('clears failed attempts after a successful change', async () => {
      const wrong = {
        currentPassword: 'Wr0ng!Pass',
        newPassword: NEW_PASSWORD,
      };
      for (let attempt = 1; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt++) {
        await changePassword(token, wrong).expect(422);
      }
      await changePassword(token, {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      }).expect(200);

      await login('Wr0ng!Pass').expect(401);
      await login(NEW_PASSWORD).expect(200);
    });

    it('lets only one of two concurrent changes with the same token win', async () => {
      const statuses = await Promise.all(
        ['N3w!Passw0rd', 'Oth3r!Passw0rd'].map((newPassword) =>
          changePassword(token, {
            currentPassword: PASSWORD,
            newPassword,
          }).then((res) => res.status),
        ),
      );

      expect(statuses.filter((status) => status === 200)).toHaveLength(1);
      expect(
        statuses.filter((status) => [401, 422].includes(status)),
      ).toHaveLength(1);
    });

    it('updates the password only for the token version that was checked', async () => {
      const usersService = app.get(UsersService);
      const [{ id }] = await app
        .get(DataSource)
        .query<{ id: string }[]>('SELECT id FROM users');

      expect(await usersService.updatePassword(id, 0, 'hash-a')).toBe(1);
      expect(await usersService.updatePassword(id, 0, 'hash-b')).toBeNull();
    });

    it('rejects a change when the user logged out everywhere meanwhile', async () => {
      const other = await bearer();
      await request(server())
        .post('/api/auth/logout')
        .set('Authorization', other)
        .expect(204);

      await changePassword(token, {
        currentPassword: PASSWORD,
        newPassword: NEW_PASSWORD,
      }).expect(401);
      await login(PASSWORD).expect(200);
    });
  });
});
