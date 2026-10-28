import type { WordsRepository } from '../words/words.repository.js';
import { AdminWordsService } from './admin-words.service.js';

describe('AdminWordsService', () => {
  const wordsRepository = { update: vi.fn(), softDelete: vi.fn() };
  const service = new AdminWordsService(
    wordsRepository as unknown as WordsRepository,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns the word from the single update query', async () => {
    const createdAt = new Date();
    const word = {
      id: 'id',
      content: 'apple',
      meaning: 'quả táo',
      createdAt,
      updatedAt: createdAt,
    };
    wordsRepository.update.mockResolvedValueOnce(word);

    await expect(service.update('id', { meaning: 'quả táo' })).resolves.toEqual(
      word,
    );
    expect(wordsRepository.update).toHaveBeenCalledWith('id', {
      meaning: 'quả táo',
    });
  });

  it.each([
    ['update', () => service.update('id', { content: 'x' }), 'update'],
    ['delete', () => service.remove('id'), 'softDelete'],
  ])('returns 404 when %s finds no live word', async (_label, run, method) => {
    wordsRepository[method as 'update'].mockResolvedValueOnce(
      method === 'update' ? null : false,
    );

    await expect(run()).rejects.toMatchObject({ status: 404 });
  });
});
