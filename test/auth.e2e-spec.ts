import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import {
  JWT_AUDIENCE,
  JWT_ISSUER,
  LOGIN_ATTEMPT_WINDOW_SECONDS,
  LOGIN_ATTEMPTS_KEY_PREFIX,
  LOGIN_LOCK_SECONDS,
  LOGIN_LOCKED_MESSAGE,
  LOGIN_MAX_FAILED_ATTEMPTS,
} from '../src/common/constants/auth.constants.js';
import {
  INVALID_MESSAGE,
  INVALID_TOKEN_MESSAGE,
  MISSING_MESSAGE,
  TAKEN_MESSAGE,
} from '../src/common/constants/error-messages.constants.js';
import { hashKey } from '../src/common/utils/hash-key.util.js';
import { REDIS_CLIENT } from '../src/redis/redis.constants.js';
import { createTestApp } from './support/create-test-app.js';
import { resetState } from './support/reset-state.js';

const REGISTER_URL = '/api/auth/register';
const LOGIN_URL = '/api/auth/login';
const LOGOUT_URL = '/api/auth/logout';
const PASSWORD = 'Str0ng!Pass';
const WRONG_PASSWORD = 'Wr0ng!Pass';
const account = {
  email: 'jane.doe@example.com',
  name: 'Jane Doe',
  password: PASSWORD,
};
const credentials = { email: account.email, password: PASSWORD };
const wrongCredentials = { email: account.email, password: WRONG_PASSWORD };

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  const register = (body: object = account) =>
    request(app.getHttpServer()).post(REGISTER_URL).send(body);
  const login = (body: object = credentials) =>
    request(app.getHttpServer()).post(LOGIN_URL).send(body);
  const logout = (authorization?: string) => {
    const req = request(app.getHttpServer()).post(LOGOUT_URL);
    return authorization ? req.set('Authorization', authorization) : req;
  };
  const bearer = async (): Promise<string> => {
    const { body } = await login().expect(200);
    return `Bearer ${body.accessToken}`;
  };
  const attemptsTtl = () =>
    app
      .get<Redis>(REDIS_CLIENT)
      .ttl(`${LOGIN_ATTEMPTS_KEY_PREFIX}${hashKey(account.email)}`);
  const signToken = (payload: object, options: object = {}) =>
    app.get(JwtService).signAsync(payload, options);

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetState(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('creates the account without returning a token', async () => {
      const res = await register({
        ...account,
        email: '  Jane.Doe@Example.COM ',
        role: 'admin',
      }).expect(201);

      expect(res.headers['cache-control']).toContain('no-store');
      expect(res.body).toEqual({
        user: {
          id: expect.any(String),
          email: account.email,
          name: account.name,
          role: 'user',
          createdAt: expect.any(String),
        },
      });
    });

    it('rejects a duplicate email ignoring case', async () => {
      await register().expect(201);
      const res = await register({
        ...account,
        email: account.email.toUpperCase(),
      }).expect(409);

      expect(res.body).toEqual({ errors: { email: [TAKEN_MESSAGE] } });
    });

    it.each([
      ['a short password', { password: 'S0!a' }, 'password'],
      ['a password without symbol', { password: 'Str0ngPass' }, 'password'],
      ['a non-ASCII password', { password: 'Str0ng!Pässword' }, 'password'],
      [
        'a too long password',
        { password: `Aa1!${'a'.repeat(125)}` },
        'password',
      ],
      ['an invalid email', { email: 'not-an-email' }, 'email'],
      ['a blank name', { name: '   ' }, 'name'],
      ['a name with control characters', { name: 'Jane\u0000' }, 'name'],
    ])('rejects %s with 422', async (_label, override, field) => {
      const res = await register({ ...account, ...override }).expect(422);

      expect(Object.keys(res.body.errors)).toContain(field);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await register().expect(201);
    });

    it('returns a token with the expected claims', async () => {
      const res = await login({
        email: 'JANE.DOE@example.com',
        password: PASSWORD,
      }).expect(200);

      expect(res.headers['cache-control']).toContain('no-store');
      expect(res.body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
        user: {
          id: expect.any(String),
          email: account.email,
          name: account.name,
          role: 'user',
          createdAt: expect.any(String),
        },
      });
      expect(JSON.stringify(res.body)).not.toMatch(/password|version/i);
      const claims = app
        .get(JwtService)
        .decode<Record<string, unknown>>(res.body.accessToken);
      expect(claims).toMatchObject({
        sub: res.body.user.id,
        ver: 0,
        iss: JWT_ISSUER,
        aud: JWT_AUDIENCE,
      });
      expect(Number(claims.exp) - Number(claims.iat)).toBe(res.body.expiresIn);
    });

    it.each([
      ['a wrong password', wrongCredentials],
      ['an unknown email', { email: 'nobody@example.com', password: PASSWORD }],
    ])('returns the same 401 for %s', async (_label, body) => {
      const res = await login(body).expect(401);

      expect(res.body).toEqual({ errors: { credentials: [INVALID_MESSAGE] } });
    });

    it('locks the email for 5 minutes after 5 failed attempts', async () => {
      await login(wrongCredentials).expect(401);
      expect(await attemptsTtl()).toBeGreaterThan(
        LOGIN_ATTEMPT_WINDOW_SECONDS - 5,
      );
      for (let attempt = 1; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt++) {
        await login(wrongCredentials).expect(401);
      }
      expect(await attemptsTtl()).toBeLessThanOrEqual(LOGIN_LOCK_SECONDS);

      for (const body of [credentials, wrongCredentials]) {
        const res = await login(body).expect(429);
        expect(res.body).toEqual({
          errors: { credentials: [LOGIN_LOCKED_MESSAGE] },
        });
      }
      const ttl = await attemptsTtl();
      expect(ttl).toBeGreaterThan(LOGIN_LOCK_SECONDS - 5);
      expect(ttl).toBeLessThanOrEqual(LOGIN_LOCK_SECONDS);
    });

    it('lets a correct password through on the last allowed attempt', async () => {
      for (let attempt = 1; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt++) {
        await login(wrongCredentials).expect(401);
      }

      await login().expect(200);
      expect(await attemptsTtl()).toBe(-2);
    });

    it('allows login again once the lock expires', async () => {
      for (let attempt = 0; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt++) {
        await login(wrongCredentials).expect(401);
      }
      await login().expect(429);

      const key = `${LOGIN_ATTEMPTS_KEY_PREFIX}${hashKey(account.email)}`;
      await app.get<Redis>(REDIS_CLIENT).del(key);
      await login().expect(200);
    });

    it('locks an unknown email the same way as a registered one', async () => {
      const unknown = { email: 'nobody@example.com', password: WRONG_PASSWORD };
      for (let attempt = 0; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt++) {
        await login(unknown).expect(401);
      }

      await login(unknown).expect(429);
    });

    it('does not let concurrent attempts exceed the limit', async () => {
      const statuses = await Promise.all(
        Array.from({ length: LOGIN_MAX_FAILED_ATTEMPTS * 2 }, () =>
          login(wrongCredentials).then((res) => res.status),
        ),
      );

      expect(statuses.filter((status) => status === 401)).toHaveLength(
        LOGIN_MAX_FAILED_ATTEMPTS,
      );
      expect(statuses.filter((status) => status === 429)).toHaveLength(
        LOGIN_MAX_FAILED_ATTEMPTS,
      );
    });

    it('resets the failure counter after a successful login', async () => {
      for (let attempt = 1; attempt < LOGIN_MAX_FAILED_ATTEMPTS; attempt++) {
        await login(wrongCredentials).expect(401);
      }
      await login().expect(200);

      await login(wrongCredentials).expect(401);
      await login().expect(200);
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      await register().expect(201);
    });

    it('signs the user out of every device', async () => {
      const laptop = await bearer();
      const phone = await bearer();

      await logout(laptop).expect(204);

      for (const token of [laptop, phone]) {
        const res = await logout(token).expect(401);
        expect(res.body).toEqual({
          errors: { token: [INVALID_TOKEN_MESSAGE] },
        });
      }
    });

    it('accepts a new login after logging out', async () => {
      await logout(await bearer()).expect(204);

      await logout(await bearer()).expect(204);
    });

    it.each([undefined, 'Token abc', 'Bearer', 'Bearer a b'])(
      'rejects authorization header %s as missing',
      async (header) => {
        const res = await logout(header).expect(401);

        expect(res.body).toEqual({ errors: { token: [MISSING_MESSAGE] } });
      },
    );

    it('rejects a tampered token', async () => {
      const [header, payload] = (await bearer()).split('.');

      await logout(`${header}.${payload}.invalid-signature`).expect(401);
    });

    it('rejects an unsigned token', async () => {
      const [, payload] = (await bearer()).split('.');
      const header = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' }),
      ).toString('base64url');

      await logout(`Bearer ${header}.${payload}.`).expect(401);
    });

    it('rejects an expired token', async () => {
      const { body } = await login().expect(200);
      const expired = await signToken(
        { sub: body.user.id, ver: 0 },
        { expiresIn: -1 },
      );

      await logout(`Bearer ${expired}`).expect(401);
    });

    it.each([
      ['another algorithm', { algorithm: 'HS512' }],
      ['another issuer', { issuer: 'someone-else' }],
      ['another audience', { audience: 'someone-else' }],
    ])('rejects a token signed with %s', async (_label, options) => {
      const { body } = await login().expect(200);
      const forged = await signToken(
        { sub: body.user.id, ver: 0 },
        { issuer: JWT_ISSUER, audience: JWT_AUDIENCE, ...options },
      );

      await logout(`Bearer ${forged}`).expect(401);
    });

    it.each([
      ['a non-UUID subject', { sub: 'not-a-uuid', ver: 0 }],
      ['a missing token version', { sub: randomUUID() }],
    ])('rejects a token with %s', async (_label, payload) => {
      await logout(`Bearer ${await signToken(payload)}`).expect(401);
    });

    it('rejects a token whose user was deleted', async () => {
      const { body } = await login().expect(200);
      await app
        .get(DataSource)
        .query('DELETE FROM users WHERE id = $1', [body.user.id]);

      await logout(`Bearer ${body.accessToken}`).expect(401);
    });
  });

  describe('rate limiting', () => {
    const originalLimit = process.env.AUTH_RATE_LIMIT;
    let limitedApp: INestApplication<App>;

    beforeAll(async () => {
      process.env.AUTH_RATE_LIMIT = '1';
      limitedApp = await createTestApp();
    });

    afterAll(async () => {
      process.env.AUTH_RATE_LIMIT = originalLimit;
      await limitedApp.close();
    });

    it.each([
      [REGISTER_URL, account],
      [LOGIN_URL, credentials],
    ])('limits %s per client', async (url, body) => {
      const server = limitedApp.getHttpServer();
      const first = await request(server).post(url).send(body);
      expect(first.status).not.toBe(429);

      await request(server).post(url).send(body).expect(429);
    });
  });
});
