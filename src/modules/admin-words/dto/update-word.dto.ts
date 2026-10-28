import { PartialType } from '@nestjs/swagger';
import { WORD_ERROR_FIELD } from '../../../common/constants/word.constants.js';
import { RequireAnyField } from '../../../common/decorators/require-any-field.decorator.js';
import { CreateWordDto } from './create-word.dto.js';

@RequireAnyField(WORD_ERROR_FIELD, ['content', 'meaning'])
export class UpdateWordDto extends PartialType(CreateWordDto, {
  skipNullProperties: false,
}) {}
