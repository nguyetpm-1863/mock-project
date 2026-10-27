import type { UserResponse } from './user-response.interface.js';

export interface TokenSubject extends UserResponse {
  tokenVersion: number;
}
