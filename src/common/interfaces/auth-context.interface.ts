import type { JwtPayload } from './jwt-payload.interface.js';
import type { UserResponse } from './user-response.interface.js';

export interface AuthContext {
  payload: JwtPayload;
  user: UserResponse;
}
