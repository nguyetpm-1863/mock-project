import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum.js';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole',
    example: UserRole.Admin,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
