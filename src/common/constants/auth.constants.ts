import { argon2id, type HashOptions } from 'argon2';

export const JWT_SECRET_MIN_LENGTH = 32;
export const DEFAULT_JWT_EXPIRES_IN_SECONDS = 86_400;
export const JWT_ALGORITHM = 'HS256';
export const JWT_ISSUER = 'mock-project';
export const JWT_AUDIENCE = 'mock-project-api';
export const AUTH_SCHEME = 'Bearer';
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_CHARACTERS_PATTERN = /^[\x20-\x7E]+$/;
export const PASSWORD_STRENGTH_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
export const PASSWORD_CHARACTERS_MESSAGE =
  'password can only contain English letters, digits, spaces and symbols';
export const PASSWORD_STRENGTH_MESSAGE =
  'password must contain a lowercase letter, an uppercase letter, a digit and a symbol';
export const PASSWORD_HASH_OPTIONS: HashOptions & { raw: false } = {
  type: argon2id,
  raw: false,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};
export const PASSWORD_HASH_CONCURRENCY = 4;
export const PASSWORD_HASH_QUEUE_LIMIT = 100;
export const UNKNOWN_USER_SECRET_BYTES = 32;
export const INITIAL_TOKEN_VERSION = 0;
export const LOGIN_ATTEMPTS_KEY_PREFIX = 'auth:login-attempts:';
export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_ATTEMPT_WINDOW_SECONDS = 900;
export const LOGIN_LOCK_SECONDS = 300;
export const LOGIN_ATTEMPTS_KEY_COUNT = 1;
export const RECORD_LOGIN_ATTEMPT_COMMAND = 'recordLoginAttempt';
export const RESET_LOGIN_ATTEMPTS_COMMAND = 'resetLoginAttempts';
export const RECORD_LOGIN_ATTEMPT_SCRIPT = `
local attempts = redis.call('INCR', KEYS[1])
if attempts == tonumber(ARGV[3]) then
  redis.call('EXPIRE', KEYS[1], ARGV[2])
elseif attempts == 1 or redis.call('TTL', KEYS[1]) == -1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return attempts
`;
export const RESET_LOGIN_ATTEMPTS_SCRIPT = `
if tonumber(redis.call('GET', KEYS[1]) or '0') <= tonumber(ARGV[1]) then
  return redis.call('DEL', KEYS[1])
end
return 0
`;
export const CREDENTIALS_ERROR_FIELD = 'credentials';
export const TOKEN_ERROR_FIELD = 'token';
export const LOGIN_LOCKED_MESSAGE =
  'too many failed attempts, try again in a few minutes';
export const LOGIN_ATTEMPTS_RESET_FAILED_MESSAGE =
  'Failed to reset login attempts';
export const SERVER_BUSY_MESSAGE = 'server is busy, try again later';
