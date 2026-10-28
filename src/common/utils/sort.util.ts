import { DESCENDING_SORT_PREFIX } from '../constants/search.constants.js';
import type { ParsedSort } from '../interfaces/parsed-sort.interface.js';

export const parseSort = <T extends string>(sort: string): ParsedSort<T> =>
  sort.startsWith(DESCENDING_SORT_PREFIX)
    ? {
        field: sort.slice(DESCENDING_SORT_PREFIX.length) as T,
        direction: 'DESC',
      }
    : { field: sort as T, direction: 'ASC' };
