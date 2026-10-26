import { toPaginated, toSkip } from './pagination.util.js';

describe('pagination utils', () => {
  it('computes the offset of a page', () => {
    expect(toSkip(1, 20)).toBe(0);
    expect(toSkip(3, 20)).toBe(40);
  });

  it('builds the paginated envelope', () => {
    expect(toPaginated(['a'], 41, 2, 20)).toEqual({
      data: ['a'],
      meta: { page: 2, limit: 20, total: 41, totalPages: 3 },
    });
  });
});
