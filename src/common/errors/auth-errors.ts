import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CREDENTIALS_ERROR_FIELD,
  LOGIN_LOCKED_MESSAGE,
  SERVER_BUSY_MESSAGE,
  TOKEN_ERROR_FIELD,
} from '../constants/auth.constants.js';
import {
  GENERIC_ERROR_FIELD,
  INVALID_MESSAGE,
} from '../constants/error-messages.constants.js';
import { apiErrors } from './api-errors.js';

export const tokenError = (message: string): UnauthorizedException =>
  new UnauthorizedException(apiErrors({ [TOKEN_ERROR_FIELD]: [message] }));

export const credentialsError = (): UnauthorizedException =>
  new UnauthorizedException(
    apiErrors({ [CREDENTIALS_ERROR_FIELD]: [INVALID_MESSAGE] }),
  );

export const loginLockedError = (): HttpException =>
  new HttpException(
    apiErrors({ [CREDENTIALS_ERROR_FIELD]: [LOGIN_LOCKED_MESSAGE] }),
    HttpStatus.TOO_MANY_REQUESTS,
  );

export const serverBusyError = (): ServiceUnavailableException =>
  new ServiceUnavailableException(
    apiErrors({ [GENERIC_ERROR_FIELD]: [SERVER_BUSY_MESSAGE] }),
  );
