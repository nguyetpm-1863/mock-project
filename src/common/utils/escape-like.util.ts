const LIKE_SPECIAL_CHARACTERS = /[\\%_]/g;

export const escapeLike = (value: string): string =>
  value.replace(LIKE_SPECIAL_CHARACTERS, '\\$&');

export const containsPattern = (value: string): string =>
  `%${escapeLike(value)}%`;
