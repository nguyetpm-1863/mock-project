import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto.js';
import { WordResponseDto } from '../../../common/dto/word-response.dto.js';
import type { Paginated } from '../../../common/interfaces/paginated.interface.js';

export class WordsPageDto implements Paginated<WordResponseDto> {
  @ApiProperty({ type: [WordResponseDto] })
  data: WordResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
