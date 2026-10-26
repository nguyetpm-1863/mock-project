import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AdminOnly } from '../../common/decorators/admin-only.decorator.js';
import { CurrentAuth } from '../../common/decorators/current-auth.decorator.js';
import { noCacheResponse } from '../../common/decorators/no-cache-response.decorator.js';
import { ApiErrorsResponseDto } from '../../common/dto/api-errors-response.dto.js';
import { UserResponseDto } from '../../common/dto/user-response.dto.js';
import type { AuthContext } from '../../common/interfaces/auth-context.interface.js';
import { AdminUsersService } from './admin-users.service.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UsersPageDto } from './dto/users-page.dto.js';

@ApiTags('admin/users')
@Controller('admin/users')
@AdminOnly()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @noCacheResponse()
  @ApiOperation({
    summary: 'List users with pagination, role filter and search',
  })
  @ApiOkResponse({ type: UsersPageDto })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Invalid query',
  })
  list(@Query() query: ListUsersQueryDto): Promise<UsersPageDto> {
    return this.adminUsersService.list(query);
  }

  @Patch(':id/role')
  @noCacheResponse()
  @ApiOperation({ summary: "Change a user's role" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorsResponseDto,
    description: 'Id is not a UUID',
  })
  @ApiNotFoundResponse({
    type: ApiErrorsResponseDto,
    description: 'User not found',
  })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Invalid role or changing your own role',
  })
  updateRole(
    @CurrentAuth() { user }: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { role }: UpdateUserRoleDto,
  ): Promise<UserResponseDto> {
    return this.adminUsersService.updateRole(user.id, id, role);
  }
}
