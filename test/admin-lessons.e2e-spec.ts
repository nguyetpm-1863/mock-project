import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/common/enums/user-role.enum.js';
import { createTestApp } from './support/create-test-app.js';
import { resetState } from './support/reset-state.js';

const LESSONS_URL = '/api/admin/lessons';
const WORDS_URL = '/api/admin/words';
const PASSWORD = 'Str0ng!Pass';
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Admin lessons (e2e)', () => {
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
  const createWord = (content: string) =>
    request(server())
      .post(WORDS_URL)
      .set('Authorization', adminToken)
      .send({ content, meaning: `${content} meaning` })
      .expect(201)
      .then((res) => res.body.id as string);
  const postLesson = (body: object) =>
    request(server())
      .post(LESSONS_URL)
      .set('Authorization', adminToken)
      .send(body);
  const patchLesson = (id: string, body: object) =>
    request(server())
      .patch(`${LESSONS_URL}/${id}`)
      .set('Authorization', adminToken)
      .send(body);
  const getLesson = (id: string) =>
    request(server())
      .get(`${LESSONS_URL}/${id}`)
      .set('Authorization', adminToken);
  const contents = (body: { words: { content: string }[] }) =>
    body.words.map((word) => word.content);
  const countRows = async (sql: string) => {
    const [{ count }] = await app
      .get(DataSource)
      .query<{ count: string }[]>(sql);
    return Number(count);
  };

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

  describe('POST /api/admin/lessons', () => {
    it('creates a lesson with its words sorted by content', async () => {
      const appleId = await createWord('apple');
      const bananaId = await createWord('banana');

      const res = await postLesson({
        title: '  Fruits ',
        wordIds: [bananaId, appleId],
      }).expect(201);

      expect(res.body).toMatchObject({ title: 'Fruits', description: null });
      expect(contents(res.body)).toEqual(['apple', 'banana']);
      expect(await countRows('SELECT count(*) FROM lesson_words')).toBe(2);
    });

    it('rejects unknown or deleted words without creating the lesson', async () => {
      const appleId = await createWord('apple');
      await request(server())
        .delete(`${WORDS_URL}/${appleId}`)
        .set('Authorization', adminToken)
        .expect(204);

      for (const wordIds of [[UNKNOWN_ID], [appleId]]) {
        const res = await postLesson({ title: 'Fruits', wordIds }).expect(422);
        expect(res.body).toEqual({
          errors: { wordIds: ['contain words that do not exist'] },
        });
      }
      expect(await countRows('SELECT count(*) FROM lessons')).toBe(0);
    });

    it.each([
      { title: '  ' },
      { title: 'Fruits', wordIds: null },
      { title: 'Fruits', wordIds: ['not-a-uuid'] },
      { title: 'Fruits', wordIds: [UNKNOWN_ID, UNKNOWN_ID] },
    ])('rejects %o with 422', async (body) => {
      await postLesson(body).expect(422);
    });
  });

  describe('GET /api/admin/lessons', () => {
    beforeEach(async () => {
      for (const title of ['Trái cây', 'Động vật', 'Colors']) {
        await postLesson({ title }).expect(201);
      }
    });

    it.each([
      [{ keyword: 'ĐỘNG' }, ['Động vật'], 1],
      [{ sort: 'title' }, ['Colors', 'Trái cây', 'Động vật'], 3],
      [{ limit: 1, page: 2 }, ['Động vật'], 3],
    ])('lists with %o', async (query, titles, total) => {
      const res = await request(server())
        .get(LESSONS_URL)
        .query(query)
        .set('Authorization', adminToken)
        .expect(200);

      expect(
        res.body.data.map((lesson: { title: string }) => lesson.title),
      ).toEqual(titles);
      expect(res.body.meta.total).toBe(total);
    });
  });

  describe('GET, PATCH and DELETE /api/admin/lessons/:id', () => {
    let lessonId: string;
    let appleId: string;
    let bananaId: string;

    beforeEach(async () => {
      appleId = await createWord('apple');
      bananaId = await createWord('banana');
      ({
        body: { id: lessonId },
      } = await postLesson({ title: 'Fruits', wordIds: [appleId] }).expect(
        201,
      ));
    });

    it('gets a lesson without its deleted words', async () => {
      expect(contents((await getLesson(lessonId).expect(200)).body)).toEqual([
        'apple',
      ]);

      await request(server())
        .delete(`${WORDS_URL}/${appleId}`)
        .set('Authorization', adminToken)
        .expect(204);

      expect((await getLesson(lessonId).expect(200)).body.words).toEqual([]);
    });

    it('updates fields and keeps the words when wordIds is missing', async () => {
      const res = await patchLesson(lessonId, {
        description: 'Common fruits',
      }).expect(200);

      expect(res.body).toMatchObject({
        title: 'Fruits',
        description: 'Common fruits',
      });
      expect(contents(res.body)).toEqual(['apple']);
    });

    it('replaces the words only when all of them exist', async () => {
      const res = await patchLesson(lessonId, { wordIds: [bananaId] }).expect(
        200,
      );
      expect(contents(res.body)).toEqual(['banana']);
      expect(Date.parse(res.body.updatedAt)).toBeGreaterThan(
        Date.parse(res.body.createdAt),
      );

      await patchLesson(lessonId, { wordIds: [appleId, UNKNOWN_ID] }).expect(
        422,
      );
      expect(contents((await getLesson(lessonId)).body)).toEqual(['banana']);

      await patchLesson(lessonId, { wordIds: [] }).expect(200);
      expect((await getLesson(lessonId)).body.words).toEqual([]);
    });

    it.each([{}, { title: null }])(
      'rejects update %o with 422',
      async (body) => {
        await patchLesson(lessonId, body).expect(422);
      },
    );

    it('soft deletes the lesson', async () => {
      await request(server())
        .delete(`${LESSONS_URL}/${lessonId}`)
        .set('Authorization', adminToken)
        .expect(204);

      await getLesson(lessonId).expect(404);
      await patchLesson(lessonId, { wordIds: [bananaId] }).expect(404);
      expect(
        await countRows(
          `SELECT count(*) FROM lesson_words WHERE word_id = '${bananaId}'`,
        ),
      ).toBe(0);
    });

    it.each(['get', 'patch', 'delete'] as const)(
      'returns 404 for an unknown id and 400 for a non-UUID id on %s',
      async (method) => {
        const send = (id: string) =>
          request(server())
            [method](`${LESSONS_URL}/${id}`)
            .set('Authorization', adminToken)
            .send({ title: 'x' });

        const notFound = await send(UNKNOWN_ID).expect(404);
        expect(notFound.body).toEqual({ errors: { lesson: ['not found'] } });
        await send('not-a-uuid').expect(400);
      },
    );
  });
});
