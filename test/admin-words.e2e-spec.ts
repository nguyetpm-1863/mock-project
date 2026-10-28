import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/common/enums/user-role.enum.js';
import { createTestApp } from './support/create-test-app.js';
import { resetState } from './support/reset-state.js';

const WORDS_URL = '/api/admin/words';
const PASSWORD = 'Str0ng!Pass';
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Admin words (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  const server = () => app.getHttpServer();
  const tokenFor = async (email: string, role: UserRole) => {
    const { body } = await request(server())
      .post('/api/auth/register')
      .send({ email, name: 'User', password: PASSWORD })
      .expect(201);
    await app
      .get(DataSource)
      .query('UPDATE users SET role = $1 WHERE id = $2', [role, body.user.id]);
    const login = await request(server())
      .post('/api/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return `Bearer ${login.body.accessToken}`;
  };
  const createWord = (content: string, meaning: string) =>
    request(server())
      .post(WORDS_URL)
      .set('Authorization', adminToken)
      .send({ content, meaning })
      .expect(201)
      .then((res) => res.body as { id: string; content: string });
  const listWords = (query: object = {}) =>
    request(server())
      .get(WORDS_URL)
      .query(query)
      .set('Authorization', adminToken);
  const contents = (body: { data: { content: string }[] }) =>
    body.data.map((word) => word.content);

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetState(app);
    adminToken = await tokenFor('admin@example.com', UserRole.Admin);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects anonymous users and non-admins', async () => {
    const userToken = await tokenFor('user@example.com', UserRole.User);

    await request(server()).get(WORDS_URL).expect(401);
    await request(server())
      .post(WORDS_URL)
      .set('Authorization', userToken)
      .send({ content: 'apple', meaning: 'quả táo' })
      .expect(403);
  });

  describe('POST /api/admin/words', () => {
    it('creates a word with trimmed NFC text', async () => {
      const res = await request(server())
        .post(WORDS_URL)
        .set('Authorization', adminToken)
        .send({
          content: '  apple ',
          meaning: ' quả táo '.normalize('NFD'),
          deletedAt: null,
        })
        .expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        content: 'apple',
        meaning: 'quả táo'.normalize('NFC'),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it.each([
      [{ meaning: 'x' }, 'content'],
      [{ content: '   ', meaning: 'x' }, 'content'],
      [{ content: 'x', meaning: 'y'.repeat(1001) }, 'meaning'],
      [{ content: 'x'.repeat(256), meaning: 'y' }, 'content'],
      [{ content: 1, meaning: 'y' }, 'content'],
    ])('rejects %o with 422', async (body, field) => {
      const res = await request(server())
        .post(WORDS_URL)
        .set('Authorization', adminToken)
        .send(body)
        .expect(422);

      expect(Object.keys(res.body.errors)).toContain(field);
    });
  });

  describe('GET /api/admin/words', () => {
    beforeEach(async () => {
      await createWord('banana', 'quả chuối');
      await createWord('apple', 'quả táo');
      await createWord('cat', 'con mèo');
    });

    it('lists newest first with pagination meta', async () => {
      const res = await listWords({ limit: 2 }).expect(200);

      expect(res.headers['cache-control']).toContain('no-store');
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
      expect(contents(res.body)).toEqual(['cat', 'apple']);
    });

    it.each([
      [{ sort: 'content' }, ['apple', 'banana', 'cat']],
      [{ sort: '-content' }, ['cat', 'banana', 'apple']],
      [{ sort: 'createdAt' }, ['banana', 'apple', 'cat']],
      [{ keyword: 'QUẢ' }, ['apple', 'banana']],
      [{ keyword: 'CON MÈO'.normalize('NFD') }, ['cat']],
      [{ keyword: '%' }, []],
    ])('applies %o', async (query, expected) => {
      const res = await listWords({ sort: 'content', ...query }).expect(200);

      expect(contents(res.body)).toEqual(expected);
    });

    it.each([{ sort: 'meaning' }, { keyword: 'x'.repeat(101) }, { limit: 0 }])(
      'rejects invalid query %o with 422',
      async (query) => {
        await listWords(query).expect(422);
      },
    );
  });

  describe('GET, PATCH and DELETE /api/admin/words/:id', () => {
    let wordId: string;
    const wordUrl = () => `${WORDS_URL}/${wordId}`;

    beforeEach(async () => {
      ({ id: wordId } = await createWord('apple', 'quả táo'));
    });

    it('gets a word', async () => {
      const res = await request(server())
        .get(wordUrl())
        .set('Authorization', adminToken)
        .expect(200);

      expect(res.body).toMatchObject({ id: wordId, content: 'apple' });
    });

    it('updates only the given field', async () => {
      const res = await request(server())
        .patch(wordUrl())
        .set('Authorization', adminToken)
        .send({ meaning: '  trái táo ' })
        .expect(200);

      expect(res.body).toEqual({
        id: wordId,
        content: 'apple',
        meaning: 'trái táo',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it.each([{ content: null }, { meaning: null }, { content: '  ' }])(
      'rejects update %o with 422',
      async (body) => {
        await request(server())
          .patch(wordUrl())
          .set('Authorization', adminToken)
          .send(body)
          .expect(422);
      },
    );

    it('rejects an empty update with 422', async () => {
      const res = await request(server())
        .patch(wordUrl())
        .set('Authorization', adminToken)
        .send({})
        .expect(422);

      expect(res.body).toEqual({ errors: { word: ["can't be blank"] } });
    });

    it('soft deletes the word so it disappears everywhere', async () => {
      await request(server())
        .delete(wordUrl())
        .set('Authorization', adminToken)
        .expect(204);

      await request(server())
        .delete(wordUrl())
        .set('Authorization', adminToken)
        .expect(404);
      await request(server())
        .get(wordUrl())
        .set('Authorization', adminToken)
        .expect(404);
      await request(server())
        .patch(wordUrl())
        .set('Authorization', adminToken)
        .send({ content: 'x' })
        .expect(404);
      expect((await listWords()).body.meta.total).toBe(0);
      const [{ count }] = await app
        .get(DataSource)
        .query<{ count: string }[]>(
          'SELECT count(*) FROM words WHERE deleted_at IS NOT NULL',
        );
      expect(count).toBe('1');
    });

    it.each(['get', 'patch', 'delete'] as const)(
      'returns 404 for an unknown id and 400 for a non-UUID id on %s',
      async (method) => {
        const send = (id: string) =>
          request(server())
            [method](`${WORDS_URL}/${id}`)
            .set('Authorization', adminToken)
            .send({ content: 'x' });

        const notFound = await send(UNKNOWN_ID).expect(404);
        expect(notFound.body).toEqual({ errors: { word: ['not found'] } });
        await send('not-a-uuid').expect(400);
      },
    );
  });
});
