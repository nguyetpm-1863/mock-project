import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  WORD_CONTENT_MAX_LENGTH,
  WORD_MEANING_MAX_LENGTH,
} from '../../../common/constants/word.constants.js';
import type { WordInput } from '../../../common/interfaces/word-input.interface.js';
import { normalizeText } from '../../../common/transforms/normalize-text.transform.js';

export class CreateWordDto implements WordInput {
  @ApiProperty({ example: 'apple', maxLength: WORD_CONTENT_MAX_LENGTH })
  @Transform(normalizeText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORD_CONTENT_MAX_LENGTH)
  content: string;

  @ApiProperty({ example: 'quả táo', maxLength: WORD_MEANING_MAX_LENGTH })
  @Transform(normalizeText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORD_MEANING_MAX_LENGTH)
  meaning: string;
}
