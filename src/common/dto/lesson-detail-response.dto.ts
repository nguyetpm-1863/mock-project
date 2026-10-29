import { ApiProperty } from '@nestjs/swagger';
import type { LessonDetailResponse } from '../interfaces/lesson-detail-response.interface.js';
import { LessonResponseDto } from './lesson-response.dto.js';
import { WordResponseDto } from './word-response.dto.js';

export class LessonDetailResponseDto
  extends LessonResponseDto
  implements LessonDetailResponse
{
  @ApiProperty({ type: [WordResponseDto] })
  words: WordResponseDto[];
}
