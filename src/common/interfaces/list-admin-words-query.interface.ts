import type { WordSort } from './word-sort.type.js';

export interface ListAdminWordsQuery {
  page: number;
  limit: number;
  keyword?: string;
  sort: WordSort;
}
