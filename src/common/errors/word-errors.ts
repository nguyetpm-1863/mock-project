import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BLANK_MESSAGE } from '../constants/error-messages.constants.js';
import { NOT_FOUND_MESSAGE } from '../constants/role.constants.js';
import { WORD_ERROR_FIELD } from '../constants/word.constants.js';
import { apiErrors } from './api-errors.js';

export const wordNotFoundError = (): NotFoundException =>
  new NotFoundException(apiErrors({ [WORD_ERROR_FIELD]: [NOT_FOUND_MESSAGE] }));

export const emptyWordUpdateError = (): UnprocessableEntityException =>
  new UnprocessableEntityException(
    apiErrors({ [WORD_ERROR_FIELD]: [BLANK_MESSAGE] }),
  );
