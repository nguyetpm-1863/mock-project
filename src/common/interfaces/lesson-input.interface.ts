import type { LessonFields } from './lesson-fields.interface.js';

export interface LessonInput extends LessonFields {
  wordIds?: string[];
}
