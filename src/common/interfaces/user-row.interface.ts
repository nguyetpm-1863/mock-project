import type { UserResponse } from './user-response.interface.js';

export interface UserRow extends Omit<UserResponse, 'createdAt'> {
  created_at: Date;
}
