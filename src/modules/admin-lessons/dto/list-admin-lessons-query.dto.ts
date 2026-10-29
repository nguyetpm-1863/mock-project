import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  DEFAULT_LESSON_SORT,
  LESSON_SEARCH_MAX_LENGTH,
  LESSON_SORT_OPTIONS,
} from '../../../common/constants/lesson.constants.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import type { ListAdminLessonsQuery } from '../../../common/interfaces/list-admin-lessons-query.interface.js';
import type { LessonSort } from '../../../common/interfaces/lesson-sort.type.js';
import { trimString } from '../../../common/transforms/trim.transform.js';

export class ListAdminLessonsQueryDto
  extends PaginationQueryDto
  implements ListAdminLessonsQuery
{
  @ApiPropertyOptional({
    description: 'Search in title (case-insensitive)',
    maxLength: LESSON_SEARCH_MAX_LENGTH,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(LESSON_SEARCH_MAX_LENGTH)
  keyword?: string;

  @ApiPropertyOptional({
    enum: LESSON_SORT_OPTIONS,
    default: DEFAULT_LESSON_SORT,
  })
  @IsIn(LESSON_SORT_OPTIONS)
  sort: LessonSort = DEFAULT_LESSON_SORT;
}
