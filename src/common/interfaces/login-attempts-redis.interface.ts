import type { Redis } from 'ioredis';

export interface LoginAttemptsRedis extends Redis {
  recordLoginAttempt(
    key: string,
    windowSeconds: number,
    lockSeconds: number,
    maxAttempts: number,
  ): Promise<number>;
  resetLoginAttempts(key: string, attempts: number): Promise<number>;
}
