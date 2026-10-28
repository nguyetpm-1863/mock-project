export const WORD_CONTENT_MAX_LENGTH = 255;
export const WORD_MEANING_MAX_LENGTH = 1000;
export const WORD_SEARCH_MAX_LENGTH = 100;
export const WORD_SORT_OPTIONS = [
  'content',
  '-content',
  'createdAt',
  '-createdAt',
] as const;
export const DEFAULT_WORD_SORT = '-createdAt';
export const WORD_ERROR_FIELD = 'word';
export const WORD_RETURNING_COLUMNS =
  'id, content, meaning, created_at AS "createdAt", updated_at AS "updatedAt"';
