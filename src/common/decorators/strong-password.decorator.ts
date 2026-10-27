import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_CHARACTERS_MESSAGE,
  PASSWORD_CHARACTERS_PATTERN,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_STRENGTH_MESSAGE,
  PASSWORD_STRENGTH_PATTERN,
} from '../constants/auth.constants.js';

export const StrongPassword = () =>
  applyDecorators(
    ApiProperty({
      example: 'N3w!Passw0rd',
      format: 'password',
      minLength: PASSWORD_MIN_LENGTH,
      maxLength: PASSWORD_MAX_LENGTH,
    }),
    IsString(),
    IsNotEmpty(),
    MinLength(PASSWORD_MIN_LENGTH),
    MaxLength(PASSWORD_MAX_LENGTH),
    Matches(PASSWORD_CHARACTERS_PATTERN, {
      message: PASSWORD_CHARACTERS_MESSAGE,
    }),
    Matches(PASSWORD_STRENGTH_PATTERN, { message: PASSWORD_STRENGTH_MESSAGE }),
  );
