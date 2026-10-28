import {
  lowerColumn,
  lowerContainsPattern,
} from './case-insensitive-search.util.js';

describe('case-insensitive search', () => {
  it('lowercases Vietnamese input and normalizes it to NFC', () => {
    expect(lowerContainsPattern('QUẢ'.normalize('NFD'))).toBe('%quả%');
  });

  it('keeps LIKE wildcards escaped', () => {
    expect(lowerContainsPattern('A_%')).toBe('%a\\_\\%%');
  });

  it('normalizes and lowercases a column with an ICU collation', () => {
    expect(lowerColumn('word.content')).toBe(
      'LOWER(NORMALIZE(word.content, NFC) COLLATE "und-x-icu")',
    );
  });
});
