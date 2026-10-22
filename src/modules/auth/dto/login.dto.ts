import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../../../common/constants/auth.constants.js';
import { USER_EMAIL_MAX_LENGTH } from '../../../common/constants/user.constants.js';
import { normalizeEmail } from '../../../common/transforms/normalize-email.transform.js';

export class LoginDto {
  @ApiProperty({
    example: 'jane.doe@example.com',
    maxLength: USER_EMAIL_MAX_LENGTH,
  })
  @Transform(normalizeEmail)
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(USER_EMAIL_MAX_LENGTH)
  email: string;

  @ApiProperty({
    example: 'Str0ng!Pass',
    format: 'password',
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
