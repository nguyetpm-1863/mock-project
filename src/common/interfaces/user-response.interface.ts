import type { UserRole } from '../enums/user-role.enum.js';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}
