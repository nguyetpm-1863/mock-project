import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/common/enums/user-role.enum.js';
import { seedAdmin } from '../src/database/seeds/seed-admin.js';
import { createTestApp } from './support/create-test-app.js';
import { resetState } from './support/reset-state.js';

const admin = {
  email: 'admin@example.com',
  name: 'Admin',
  password: 'Adm1n!Pass',
};

describe('seedAdmin (e2e)', () => {
  let app: INestApplication<App>;

  const login = (email: string, password: string) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetState(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a new admin who can log in', async () => {
    const result = await seedAdmin(app.get(DataSource), {
      ...admin,
      email: ' Admin@Example.com ',
    });

    expect(result.created).toBe(true);
    const res = await login(admin.email, admin.password).expect(200);
    expect(res.body.user).toMatchObject({
      id: result.id,
      email: admin.email,
      role: UserRole.Admin,
    });
  });

  it('takes over an existing account: new password, old sessions revoked', async () => {
    const squatter = { ...admin, name: 'Squatter', password: 'Squ4tter!Pass' };
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(squatter)
      .expect(201);
    const { body } = await login(admin.email, squatter.password).expect(200);

    const result = await seedAdmin(app.get(DataSource), admin);

    expect(result.created).toBe(false);
    await login(admin.email, squatter.password).expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(401);
    const res = await login(admin.email, admin.password).expect(200);
    expect(res.body.user).toMatchObject({
      name: admin.name,
      role: UserRole.Admin,
    });
  });

  it('rejects invalid input without touching the database', async () => {
    await expect(
      seedAdmin(app.get(DataSource), { ...admin, password: 'weak' }),
    ).rejects.toThrow('Invalid seed input: password');

    const [{ count }] = await app
      .get(DataSource)
      .query<{ count: string }[]>('SELECT count(*) FROM users');
    expect(count).toBe('0');
  });
});
