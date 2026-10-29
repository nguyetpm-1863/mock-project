import { ApiProperty } from '@nestjs/swagger';
import { LessonResponseDto } from '../../../common/dto/lesson-response.dto.js';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto.js';
import type { Paginated } from '../../../common/interfaces/paginated.interface.js';

export class LessonsPageDto implements Paginated<LessonResponseDto> {
  @ApiProperty({ type: [LessonResponseDto] })
  data: LessonResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
