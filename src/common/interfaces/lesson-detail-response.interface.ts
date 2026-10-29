import type { LessonResponse } from './lesson-response.interface.js';
import type { WordResponse } from './word-response.interface.js';

export interface LessonDetailResponse extends LessonResponse {
  words: WordResponse[];
}
