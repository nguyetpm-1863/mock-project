import { ApiProperty } from '@nestjs/swagger';
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from '../constants/user.constants.js';
import type { UserResponse } from '../interfaces/user-response.interface.js';

export class UserResponseDto implements UserResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    format: 'email',
    maxLength: USER_EMAIL_MAX_LENGTH,
    example: 'jane.doe@example.com',
  })
  email: string;

  @ApiProperty({ maxLength: USER_NAME_MAX_LENGTH, example: 'Jane Doe' })
  name: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
