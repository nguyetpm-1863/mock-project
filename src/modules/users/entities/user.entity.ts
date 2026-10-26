import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { USER_ROLE_ENUM_NAME } from '../../../common/constants/role.constants.js';
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_HASH_MAX_LENGTH,
} from '../../../common/constants/user.constants.js';
import { INITIAL_TOKEN_VERSION } from '../../../common/constants/auth.constants.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import type { UserResponse } from '../../../common/interfaces/user-response.interface.js';

@Entity('users')
@Check('CHK_users_email_lowercase', `"email" = LOWER("email")`)
export class User implements UserResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: USER_EMAIL_MAX_LENGTH, unique: true })
  email: string;

  @Column({ type: 'varchar', length: USER_NAME_MAX_LENGTH })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: USER_ROLE_ENUM_NAME,
    default: UserRole.User,
  })
  role: UserRole;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: USER_PASSWORD_HASH_MAX_LENGTH,
    select: false,
  })
  passwordHash: string;

  @Column({
    name: 'token_version',
    type: 'integer',
    default: INITIAL_TOKEN_VERSION,
  })
  tokenVersion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
