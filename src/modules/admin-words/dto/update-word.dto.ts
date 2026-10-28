import { PartialType } from '@nestjs/swagger';
import { CreateWordDto } from './create-word.dto.js';

export class UpdateWordDto extends PartialType(CreateWordDto, {
  skipNullProperties: false,
}) {}
