import type { LessonSort } from './lesson-sort.type.js';

export interface ListAdminLessonsQuery {
  page: number;
  limit: number;
  keyword?: string;
  sort: LessonSort;
}
