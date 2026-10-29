import type { LessonDetailResponse } from '../interfaces/lesson-detail-response.interface.js';
import type { LessonResponse } from '../interfaces/lesson-response.interface.js';
import type { WordResponse } from '../interfaces/word-response.interface.js';
import { toWordResponse } from './word.mapper.js';

export const toLessonResponse = ({
  id,
  title,
  description,
  createdAt,
  updatedAt,
}: LessonResponse): LessonResponse => ({
  id,
  title,
  description,
  createdAt,
  updatedAt,
});

export const toLessonDetail = (
  lesson: LessonResponse,
  words: WordResponse[],
): LessonDetailResponse => ({
  ...toLessonResponse(lesson),
  words: words.map(toWordResponse),
});
