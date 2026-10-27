import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../../../common/constants/auth.constants.js';
import { StrongPassword } from '../../../common/decorators/strong-password.decorator.js';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Str0ng!Pass',
    format: 'password',
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  currentPassword: string;

  @StrongPassword()
  newPassword: string;
}
