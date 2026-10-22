import { ApiProperty } from '@nestjs/swagger';
import type { ApiErrors } from '../errors/api-errors.js';

export class ApiErrorsResponseDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
    example: { email: ['email must be an email'] },
  })
  errors: ApiErrors;
}
