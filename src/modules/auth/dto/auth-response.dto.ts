import { ApiProperty } from '@nestjs/swagger';
import { AUTH_SCHEME } from '../../../common/constants/auth.constants.js';
import { UserResponseDto } from '../../../common/dto/user-response.dto.js';
import type { AuthResponse } from '../../../common/interfaces/auth-response.interface.js';

export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ enum: [AUTH_SCHEME], example: AUTH_SCHEME })
  tokenType: string;

  @ApiProperty({ description: 'Token lifetime in seconds', example: 86_400 })
  expiresIn: number;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
