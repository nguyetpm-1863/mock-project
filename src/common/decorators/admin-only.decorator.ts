import { applyDecorators, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../modules/auth/guards/roles.guard.js';
import { ApiErrorsResponseDto } from '../dto/api-errors-response.dto.js';
import { UserRole } from '../enums/user-role.enum.js';
import { Roles } from './roles.decorator.js';

export const AdminOnly = () =>
  applyDecorators(
    Roles(UserRole.Admin),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      type: ApiErrorsResponseDto,
      description: 'Token is missing, invalid or revoked',
    }),
    ApiForbiddenResponse({
      type: ApiErrorsResponseDto,
      description: 'Admin role required',
    }),
  );
