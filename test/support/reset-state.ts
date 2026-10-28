import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { DataSource } from 'typeorm';
import type { RedisConfig } from '../../src/common/interfaces/redis-config.interface.js';
import { REDIS_CLIENT } from '../../src/redis/redis.constants.js';

export const resetState = async (app: INestApplication): Promise<void> => {
  const redis = app.get<Redis>(REDIS_CLIENT);
  const { keyPrefix } = app.get(ConfigService).getOrThrow<RedisConfig>('redis');
  const keys = await redis.keys(`${keyPrefix}*`);
  await Promise.all([
    app.get(DataSource).query('TRUNCATE TABLE users, words CASCADE'),
    keys.length > 0
      ? redis.del(...keys.map((key) => key.slice(keyPrefix.length)))
      : Promise.resolve(0),
  ]);
};
