import type { UserResponse } from '../interfaces/user-response.interface.js';

export const toUserResponse = ({
  id,
  email,
  name,
  role,
  createdAt,
}: UserResponse): UserResponse => ({ id, email, name, role, createdAt });
