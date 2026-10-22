import type { UserResponse } from '../interfaces/user-response.interface.js';

export const toUserResponse = ({
  id,
  email,
  name,
  createdAt,
}: UserResponse): UserResponse => ({ id, email, name, createdAt });
