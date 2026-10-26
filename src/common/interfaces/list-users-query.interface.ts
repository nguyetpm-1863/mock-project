import type { UserRole } from '../enums/user-role.enum.js';

export interface ListUsersQuery {
  page: number;
  limit: number;
  role?: UserRole;
  keyword?: string;
}
