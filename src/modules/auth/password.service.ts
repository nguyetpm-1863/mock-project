import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import {
  PASSWORD_HASH_CONCURRENCY,
  PASSWORD_HASH_OPTIONS,
  PASSWORD_HASH_QUEUE_LIMIT,
} from '../../common/constants/auth.constants.js';
import { ConcurrencyLimiter } from '../../common/utils/concurrency-limiter.util.js';

@Injectable()
export class PasswordService {
  private readonly limiter = new ConcurrencyLimiter(
    PASSWORD_HASH_CONCURRENCY,
    PASSWORD_HASH_QUEUE_LIMIT,
  );

  hash(password: string): Promise<string> {
    return this.limiter.run(() => argon2.hash(password, PASSWORD_HASH_OPTIONS));
  }

  verify(hash: string, password: string): Promise<boolean> {
    return this.limiter.run(() => argon2.verify(hash, password));
  }
}
