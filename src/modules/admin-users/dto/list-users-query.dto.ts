import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { USER_SEARCH_MAX_LENGTH } from '../../../common/constants/role.constants.js';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import type { ListUsersQuery } from '../../../common/interfaces/list-users-query.interface.js';
import { trimString } from '../../../common/transforms/trim.transform.js';

export class ListUsersQueryDto
  extends PaginationQueryDto
  implements ListUsersQuery
{
  @ApiPropertyOptional({ enum: UserRole, enumName: 'UserRole' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Search by email or name',
    maxLength: USER_SEARCH_MAX_LENGTH,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(USER_SEARCH_MAX_LENGTH)
  keyword?: string;
}
