import { parseSort } from './sort.util.js';

describe('parseSort', () => {
  it('reads ascending and descending sorts', () => {
    expect(parseSort('content')).toEqual({
      field: 'content',
      direction: 'ASC',
    });
    expect(parseSort('-createdAt')).toEqual({
      field: 'createdAt',
      direction: 'DESC',
    });
  });
});
