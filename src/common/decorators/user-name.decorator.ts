import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import {
  USER_NAME_CHARACTERS_MESSAGE,
  USER_NAME_MAX_LENGTH,
  USER_NAME_PATTERN,
} from '../constants/user.constants.js';
import { trimString } from '../transforms/trim.transform.js';

export const UserName = () =>
  applyDecorators(
    ApiProperty({ example: 'Jane Doe', maxLength: USER_NAME_MAX_LENGTH }),
    Transform(trimString),
    IsString(),
    IsNotEmpty(),
    MaxLength(USER_NAME_MAX_LENGTH),
    Matches(USER_NAME_PATTERN, { message: USER_NAME_CHARACTERS_MESSAGE }),
  );
