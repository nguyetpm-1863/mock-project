import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  DEFAULT_WORD_SORT,
  WORD_SEARCH_MAX_LENGTH,
  WORD_SORT_OPTIONS,
} from '../../../common/constants/word.constants.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import type { ListAdminWordsQuery } from '../../../common/interfaces/list-admin-words-query.interface.js';
import type { WordSort } from '../../../common/interfaces/word-sort.type.js';
import { trimString } from '../../../common/transforms/trim.transform.js';

export class ListAdminWordsQueryDto
  extends PaginationQueryDto
  implements ListAdminWordsQuery
{
  @ApiPropertyOptional({
    description: 'Search in content or meaning (case-insensitive)',
    maxLength: WORD_SEARCH_MAX_LENGTH,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(WORD_SEARCH_MAX_LENGTH)
  keyword?: string;

  @ApiPropertyOptional({ enum: WORD_SORT_OPTIONS, default: DEFAULT_WORD_SORT })
  @IsIn(WORD_SORT_OPTIONS)
  sort: WordSort = DEFAULT_WORD_SORT;
}
