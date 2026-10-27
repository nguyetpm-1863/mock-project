import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AUTH_THROTTLE } from '../../common/constants/throttle.constants.js';
import { CurrentAuth } from '../../common/decorators/current-auth.decorator.js';
import { noCacheResponse } from '../../common/decorators/no-cache-response.decorator.js';
import { ApiErrorsResponseDto } from '../../common/dto/api-errors-response.dto.js';
import { UserResponseDto } from '../../common/dto/user-response.dto.js';
import type { AuthContext } from '../../common/interfaces/auth-context.interface.js';
import { toUserResponse } from '../../common/mappers/user.mapper.js';
import { AuthService } from '../auth/auth.service.js';
import { AuthResponseDto } from '../auth/dto/auth-response.dto.js';
import { ChangePasswordDto } from '../auth/dto/change-password.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('profile')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  type: ApiErrorsResponseDto,
  description: 'Token is missing, invalid or revoked',
})
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @noCacheResponse()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  getProfile(@CurrentAuth() { user }: AuthContext): UserResponseDto {
    return toUserResponse(user);
  }

  @Patch()
  @noCacheResponse()
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed',
  })
  updateProfile(
    @CurrentAuth() { user }: AuthContext,
    @Body() { name }: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.profileService.updateName(user, name);
  }

  @Patch('password')
  @Throttle(AUTH_THROTTLE)
  @noCacheResponse()
  @ApiOperation({
    summary: 'Change password, sign out other devices and return a new token',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Current password is incorrect or new password is invalid',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorsResponseDto,
    description: 'Token revoked while the request was running',
  })
  @ApiTooManyRequestsResponse({
    type: ApiErrorsResponseDto,
    description: 'Too many requests or too many wrong passwords',
  })
  @ApiServiceUnavailableResponse({
    type: ApiErrorsResponseDto,
    description: 'Server is busy hashing passwords',
  })
  changePassword(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ChangePasswordDto,
  ): Promise<AuthResponseDto> {
    return this.authService.changePassword(auth, dto);
  }
}
