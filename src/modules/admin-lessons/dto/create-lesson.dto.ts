import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  LESSON_DESCRIPTION_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
  LESSON_WORDS_MAX_SIZE,
} from '../../../common/constants/lesson.constants.js';
import type { LessonInput } from '../../../common/interfaces/lesson-input.interface.js';
import { normalizeText } from '../../../common/transforms/normalize-text.transform.js';

export class CreateLessonDto implements LessonInput {
  @ApiProperty({ example: 'Fruits', maxLength: LESSON_TITLE_MAX_LENGTH })
  @Transform(normalizeText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(LESSON_TITLE_MAX_LENGTH)
  title: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Common fruit names',
    maxLength: LESSON_DESCRIPTION_MAX_LENGTH,
  })
  @Transform(normalizeText)
  @IsOptional()
  @IsString()
  @MaxLength(LESSON_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    maxItems: LESSON_WORDS_MAX_SIZE,
    description: 'Ids of the words in the lesson',
  })
  @ValidateIf((dto: CreateLessonDto) => dto.wordIds !== undefined)
  @IsArray()
  @ArrayMaxSize(LESSON_WORDS_MAX_SIZE)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  wordIds?: string[];
}
