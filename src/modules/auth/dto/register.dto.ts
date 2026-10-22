import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
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
} from '../../../common/constants/auth.constants.js';
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_CHARACTERS_MESSAGE,
  USER_NAME_MAX_LENGTH,
  USER_NAME_PATTERN,
} from '../../../common/constants/user.constants.js';
import { normalizeEmail } from '../../../common/transforms/normalize-email.transform.js';
import { trimString } from '../../../common/transforms/trim.transform.js';

export class RegisterDto {
  @ApiProperty({
    example: 'jane.doe@example.com',
    maxLength: USER_EMAIL_MAX_LENGTH,
  })
  @Transform(normalizeEmail)
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(USER_EMAIL_MAX_LENGTH)
  email: string;

  @ApiProperty({ example: 'Jane Doe', maxLength: USER_NAME_MAX_LENGTH })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(USER_NAME_MAX_LENGTH)
  @Matches(USER_NAME_PATTERN, { message: USER_NAME_CHARACTERS_MESSAGE })
  name: string;

  @ApiProperty({
    example: 'Str0ng!Pass',
    format: 'password',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_CHARACTERS_PATTERN, {
    message: PASSWORD_CHARACTERS_MESSAGE,
  })
  @Matches(PASSWORD_STRENGTH_PATTERN, { message: PASSWORD_STRENGTH_MESSAGE })
  password: string;
}
