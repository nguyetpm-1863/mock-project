import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto.js';
import { UserResponseDto } from '../../../common/dto/user-response.dto.js';
import type { Paginated } from '../../../common/interfaces/paginated.interface.js';

export class UsersPageDto implements Paginated<UserResponseDto> {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
