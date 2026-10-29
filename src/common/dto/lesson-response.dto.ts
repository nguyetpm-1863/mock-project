import { ApiProperty } from '@nestjs/swagger';
import {
  LESSON_DESCRIPTION_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
} from '../constants/lesson.constants.js';
import type { LessonResponse } from '../interfaces/lesson-response.interface.js';

export class LessonResponseDto implements LessonResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ maxLength: LESSON_TITLE_MAX_LENGTH, example: 'Fruits' })
  title: string;

  @ApiProperty({
    type: String,
    nullable: true,
    maxLength: LESSON_DESCRIPTION_MAX_LENGTH,
    example: 'Common fruit names',
  })
  description: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
