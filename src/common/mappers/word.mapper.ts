import type { WordResponse } from '../interfaces/word-response.interface.js';

export const toWordResponse = ({
  id,
  content,
  meaning,
  createdAt,
  updatedAt,
}: WordResponse): WordResponse => ({
  id,
  content,
  meaning,
  createdAt,
  updatedAt,
});
