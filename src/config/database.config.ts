import { registerAs } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/entities/user.entity.js';
import { requireEnv } from './require-env.js';

export default registerAs('database', (): DataSourceOptions => ({
  type: 'postgres',
  host: requireEnv('DB_HOST'),
  port: Number(requireEnv('DB_PORT')),
  username: requireEnv('DB_USERNAME'),
  password: process.env.DB_PASSWORD ?? '',
  database: requireEnv('DB_DATABASE'),
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true',
  uuidExtension: 'pgcrypto',
  installExtensions: false,
  entities: [User],
  migrations: [`${import.meta.dirname}/../database/migrations/*.js`],
  synchronize: false,
}));
