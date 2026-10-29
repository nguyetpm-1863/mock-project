import type { DataSource } from 'typeorm';
import type { LessonsRepository } from '../lessons/lessons.repository.js';
import type { WordsRepository } from '../words/words.repository.js';
import { AdminLessonsService } from './admin-lessons.service.js';

describe('AdminLessonsService', () => {
  const dataSource = { transaction: vi.fn() };
  const lessonsRepository = { update: vi.fn() };
  const wordsRepository = { findByIds: vi.fn(), findByLesson: vi.fn() };
  const service = new AdminLessonsService(
    dataSource as unknown as DataSource,
    lessonsRepository as unknown as LessonsRepository,
    wordsRepository as unknown as WordsRepository,
  );
  const createdAt = new Date();
  const lesson = {
    id: 'lesson-id',
    title: 'Fruits',
    description: null,
    createdAt,
    updatedAt: createdAt,
  };
  const word = {
    id: 'word-id',
    content: 'apple',
    meaning: 'quả táo',
    createdAt,
    updatedAt: createdAt,
  };

  beforeEach(() => vi.clearAllMocks());

  it('rejects unknown words before opening a transaction', async () => {
    wordsRepository.findByIds.mockResolvedValueOnce([word]);

    await expect(
      service.create({ title: 'Fruits', wordIds: ['word-id', 'other-id'] }),
    ).rejects.toMatchObject({
      status: 422,
      response: { errors: { wordIds: ['contain words that do not exist'] } },
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('updates fields and loads the words in parallel when wordIds is missing', async () => {
    lessonsRepository.update.mockResolvedValueOnce(lesson);
    wordsRepository.findByLesson.mockResolvedValueOnce([word]);

    await expect(
      service.update('lesson-id', { title: 'Fruits' }),
    ).resolves.toEqual({ ...lesson, words: [word] });
    expect(lessonsRepository.update).toHaveBeenCalledWith('lesson-id', {
      title: 'Fruits',
    });
    expect(wordsRepository.findByIds).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
