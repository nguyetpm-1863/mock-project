import { PartialType } from '@nestjs/swagger';
import { LESSON_ERROR_FIELD } from '../../../common/constants/lesson.constants.js';
import { RequireAnyField } from '../../../common/decorators/require-any-field.decorator.js';
import { CreateLessonDto } from './create-lesson.dto.js';

@RequireAnyField(LESSON_ERROR_FIELD, ['title', 'description', 'wordIds'])
export class UpdateLessonDto extends PartialType(CreateLessonDto, {
  skipNullProperties: false,
}) {}
