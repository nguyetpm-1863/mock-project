import { ApiProperty } from '@nestjs/swagger';
import type { ApiErrors } from '../interfaces/api-errors.interface.js';

export class ApiErrorsResponseDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
    example: { email: ['email must be an email'] },
  })
  errors: ApiErrors;
}
