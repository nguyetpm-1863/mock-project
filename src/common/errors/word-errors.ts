import { NotFoundException } from '@nestjs/common';
import { NOT_FOUND_MESSAGE } from '../constants/role.constants.js';
import { WORD_ERROR_FIELD } from '../constants/word.constants.js';
import { apiErrors } from './api-errors.js';

export const wordNotFoundError = (): NotFoundException =>
  new NotFoundException(apiErrors({ [WORD_ERROR_FIELD]: [NOT_FOUND_MESSAGE] }));
