import { registerAs } from '@nestjs/config';
import { requireEnv } from './require-env.js';
import type { AuthConfig } from '../common/interfaces/auth-config.interface.js';

export default registerAs('auth', (): AuthConfig => ({
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: Number(requireEnv('JWT_EXPIRES_IN')),
}));
