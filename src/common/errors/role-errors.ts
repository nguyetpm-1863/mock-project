import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  FORBIDDEN_MESSAGE,
  NOT_FOUND_MESSAGE,
  OWN_ROLE_CHANGE_MESSAGE,
  ROLE_ERROR_FIELD,
  USER_ERROR_FIELD,
} from '../constants/role.constants.js';
import { RESOURCE_ERROR_FIELD } from '../constants/error-messages.constants.js';
import { apiErrors } from './api-errors.js';

export const forbiddenError = (): ForbiddenException =>
  new ForbiddenException(
    apiErrors({ [RESOURCE_ERROR_FIELD]: [FORBIDDEN_MESSAGE] }),
  );

export const userNotFoundError = (): NotFoundException =>
  new NotFoundException(apiErrors({ [USER_ERROR_FIELD]: [NOT_FOUND_MESSAGE] }));

export const ownRoleChangeError = (): UnprocessableEntityException =>
  new UnprocessableEntityException(
    apiErrors({ [ROLE_ERROR_FIELD]: [OWN_ROLE_CHANGE_MESSAGE] }),
  );
