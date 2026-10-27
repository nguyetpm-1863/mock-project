import { UnprocessableEntityException } from '@nestjs/common';
import {
  CURRENT_PASSWORD_ERROR_FIELD,
  CURRENT_PASSWORD_INVALID_MESSAGE,
  NEW_PASSWORD_ERROR_FIELD,
  SAME_PASSWORD_MESSAGE,
} from '../constants/password.constants.js';
import { apiErrors } from './api-errors.js';

export const currentPasswordError = (): UnprocessableEntityException =>
  new UnprocessableEntityException(
    apiErrors({
      [CURRENT_PASSWORD_ERROR_FIELD]: [CURRENT_PASSWORD_INVALID_MESSAGE],
    }),
  );

export const samePasswordError = (): UnprocessableEntityException =>
  new UnprocessableEntityException(
    apiErrors({ [NEW_PASSWORD_ERROR_FIELD]: [SAME_PASSWORD_MESSAGE] }),
  );
