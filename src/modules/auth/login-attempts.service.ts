import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  LOGIN_ATTEMPT_WINDOW_SECONDS,
  LOGIN_ATTEMPTS_RESET_FAILED_MESSAGE,
  LOGIN_ATTEMPTS_KEY_COUNT,
  LOGIN_ATTEMPTS_KEY_PREFIX,
  LOGIN_LOCK_SECONDS,
  LOGIN_MAX_FAILED_ATTEMPTS,
  RECORD_LOGIN_ATTEMPT_COMMAND,
  RECORD_LOGIN_ATTEMPT_SCRIPT,
  RESET_LOGIN_ATTEMPTS_COMMAND,
  RESET_LOGIN_ATTEMPTS_SCRIPT,
} from '../../common/constants/auth.constants.js';
import type { LoginAttemptsRedis } from '../../common/interfaces/login-attempts-redis.interface.js';
import { hashKey } from '../../common/utils/hash-key.util.js';
import { REDIS_CLIENT } from '../../redis/redis.constants.js';

@Injectable()
export class LoginAttemptsService {
  private readonly redis: LoginAttemptsRedis;

  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    redis.defineCommand(RECORD_LOGIN_ATTEMPT_COMMAND, {
      numberOfKeys: LOGIN_ATTEMPTS_KEY_COUNT,
      lua: RECORD_LOGIN_ATTEMPT_SCRIPT,
    });
    redis.defineCommand(RESET_LOGIN_ATTEMPTS_COMMAND, {
      numberOfKeys: LOGIN_ATTEMPTS_KEY_COUNT,
      lua: RESET_LOGIN_ATTEMPTS_SCRIPT,
    });
    this.redis = redis as LoginAttemptsRedis;
  }

  recordAttempt(email: string): Promise<number> {
    return this.redis.recordLoginAttempt(
      this.key(email),
      LOGIN_ATTEMPT_WINDOW_SECONDS,
      LOGIN_LOCK_SECONDS,
      LOGIN_MAX_FAILED_ATTEMPTS,
    );
  }

  async reset(email: string, attempts: number): Promise<void> {
    const key = this.key(email);
    await this.redis
      .resetLoginAttempts(key, attempts)
      .catch(() =>
        Logger.warn(
          LOGIN_ATTEMPTS_RESET_FAILED_MESSAGE,
          LoginAttemptsService.name,
        ),
      );
  }

  private key(email: string): string {
    return `${LOGIN_ATTEMPTS_KEY_PREFIX}${hashKey(email)}`;
  }
}
