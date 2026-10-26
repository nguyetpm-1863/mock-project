import type { Paginated } from '../interfaces/paginated.interface.js';

export const toSkip = (page: number, limit: number): number =>
  (page - 1) * limit;

export const toPaginated = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> => ({
  data,
  meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
});
