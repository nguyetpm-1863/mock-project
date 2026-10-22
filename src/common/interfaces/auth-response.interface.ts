import type { UserResponse } from './user-response.interface.js';

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}
