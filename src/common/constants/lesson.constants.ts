export const LESSON_TITLE_MAX_LENGTH = 255;
export const LESSON_DESCRIPTION_MAX_LENGTH = 1000;
export const LESSON_SEARCH_MAX_LENGTH = 100;
export const LESSON_WORDS_MAX_SIZE = 100;
export const LESSON_SORT_OPTIONS = [
  'title',
  '-title',
  'createdAt',
  '-createdAt',
] as const;
export const DEFAULT_LESSON_SORT = '-createdAt';
export const LESSON_ERROR_FIELD = 'lesson';
export const LESSON_WORD_IDS_FIELD = 'wordIds';
export const UNKNOWN_WORDS_MESSAGE = 'contain words that do not exist';
export const LESSON_WORDS_TABLE = 'lesson_words';
export const LESSON_RETURNING_COLUMNS =
  'id, title, description, created_at AS "createdAt", updated_at AS "updatedAt"';
