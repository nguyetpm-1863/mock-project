import { ApiProperty } from '@nestjs/swagger';
import {
  WORD_CONTENT_MAX_LENGTH,
  WORD_MEANING_MAX_LENGTH,
} from '../constants/word.constants.js';
import type { WordResponse } from '../interfaces/word-response.interface.js';

export class WordResponseDto implements WordResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ maxLength: WORD_CONTENT_MAX_LENGTH, example: 'apple' })
  content: string;

  @ApiProperty({ maxLength: WORD_MEANING_MAX_LENGTH, example: 'quả táo' })
  meaning: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
