import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  LESSON_ERROR_FIELD,
  LESSON_WORD_IDS_FIELD,
  UNKNOWN_WORDS_MESSAGE,
} from '../constants/lesson.constants.js';
import { NOT_FOUND_MESSAGE } from '../constants/role.constants.js';
import { apiErrors } from './api-errors.js';

export const lessonNotFoundError = (): NotFoundException =>
  new NotFoundException(
    apiErrors({ [LESSON_ERROR_FIELD]: [NOT_FOUND_MESSAGE] }),
  );

export const unknownWordsError = (): UnprocessableEntityException =>
  new UnprocessableEntityException(
    apiErrors({ [LESSON_WORD_IDS_FIELD]: [UNKNOWN_WORDS_MESSAGE] }),
  );
