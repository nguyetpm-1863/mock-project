import { containsPattern, escapeLike } from './escape-like.util.js';

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('50%_off\\now')).toBe('50\\%\\_off\\\\now');
  });

  it('wraps the escaped value for a contains search', () => {
    expect(containsPattern('a_b')).toBe('%a\\_b%');
  });
});
