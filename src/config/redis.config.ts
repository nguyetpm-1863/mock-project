import { registerAs } from '@nestjs/config';
import { requireEnv } from './require-env.js';

export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  keyPrefix: string;
  password?: string;
  tls?: object;
}

export default registerAs('redis', (): RedisConfig => ({
  host: requireEnv('REDIS_HOST'),
  port: Number(requireEnv('REDIS_PORT')),
  db: Number(requireEnv('REDIS_DB')),
  keyPrefix: requireEnv('REDIS_KEY_PREFIX'),
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
}));
