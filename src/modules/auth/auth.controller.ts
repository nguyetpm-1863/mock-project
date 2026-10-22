import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
import type { AuthContext } from '../../common/interfaces/auth-context.interface.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterResponseDto } from './dto/register-response.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @noCacheResponse()
  @ApiOperation({ summary: 'Register a new account' })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiConflictResponse({
    type: ApiErrorsResponseDto,
    description: 'Email already taken',
  })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed',
  })
  @ApiTooManyRequestsResponse({
    type: ApiErrorsResponseDto,
    description: 'Too many requests',
  })
  @ApiServiceUnavailableResponse({
    type: ApiErrorsResponseDto,
    description: 'Server is busy hashing passwords',
  })
  register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @noCacheResponse()
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    type: ApiErrorsResponseDto,
    description: 'Email or password is invalid',
  })
  @ApiUnprocessableEntityResponse({
    type: ApiErrorsResponseDto,
    description: 'Validation failed',
  })
  @ApiTooManyRequestsResponse({
    type: ApiErrorsResponseDto,
    description: 'Too many requests or email locked for 5 minutes',
  })
  @ApiServiceUnavailableResponse({
    type: ApiErrorsResponseDto,
    description: 'Server is busy hashing passwords',
  })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @noCacheResponse()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out from all devices' })
  @ApiNoContentResponse({
    description: 'All access tokens of the user revoked',
  })
  @ApiUnauthorizedResponse({
    type: ApiErrorsResponseDto,
    description: 'Token is missing, invalid or revoked',
  })
  @ApiTooManyRequestsResponse({
    type: ApiErrorsResponseDto,
    description: 'Too many requests',
  })
  logout(@CurrentAuth() { user }: AuthContext): Promise<void> {
    return this.authService.logout(user.id);
  }
}
