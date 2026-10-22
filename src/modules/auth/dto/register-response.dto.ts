import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../../common/dto/user-response.dto.js';
import type { RegisterResponse } from '../../../common/interfaces/register-response.interface.js';

export class RegisterResponseDto implements RegisterResponse {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
