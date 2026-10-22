import Joi from 'joi';
import { DEFAULT_AUTH_RATE_LIMIT } from '../common/constants/app.constants.js';
import {
  DEFAULT_JWT_EXPIRES_IN_SECONDS,
  JWT_SECRET_MIN_LENGTH,
} from '../common/constants/auth.constants.js';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string | string[];
  swaggerEnabled: boolean;
  trustProxyHops: number;
}

const ANY_ORIGIN = '*';

const requiredInProduction = Joi.string().when('NODE_ENV', {
  is: 'production',
  then: Joi.required(),
  otherwise: Joi.allow('').default(''),
});

const parseCorsOrigin = (value: string): string | string[] =>
  value === ANY_ORIGIN
    ? ANY_ORIGIN
    : value.split(',').map((origin) => origin.trim());

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGIN: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().invalid(ANY_ORIGIN).required(),
    otherwise: Joi.string().default(ANY_ORIGIN),
  }),
  SWAGGER_ENABLED: Joi.boolean().when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().default(false),
    otherwise: Joi.boolean().default(true),
  }),
  TRUST_PROXY_HOPS: Joi.number().integer().min(0).default(0),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  REDIS_KEY_PREFIX: Joi.string().default('mock-project:'),
  REDIS_PASSWORD: requiredInProduction,
  REDIS_TLS: Joi.boolean().default(false),
  AUTH_RATE_LIMIT: Joi.number()
    .integer()
    .positive()
    .default(DEFAULT_AUTH_RATE_LIMIT),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: requiredInProduction,
  DB_DATABASE: Joi.string().required(),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  JWT_SECRET: Joi.string().min(JWT_SECRET_MIN_LENGTH).required(),
  JWT_EXPIRES_IN: Joi.number()
    .integer()
    .positive()
    .default(DEFAULT_JWT_EXPIRES_IN_SECONDS),
});

export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN ?? ANY_ORIGIN),
    swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
    trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 0),
  },
});
