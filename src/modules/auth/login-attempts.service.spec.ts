import { Test } from '@nestjs/testing';
import {
  LOGIN_ATTEMPT_WINDOW_SECONDS,
  LOGIN_ATTEMPTS_KEY_COUNT,
  LOGIN_ATTEMPTS_KEY_PREFIX,
  LOGIN_LOCK_SECONDS,
  LOGIN_MAX_FAILED_ATTEMPTS,
  RECORD_LOGIN_ATTEMPT_COMMAND,
  RECORD_LOGIN_ATTEMPT_SCRIPT,
  RESET_LOGIN_ATTEMPTS_COMMAND,
  RESET_LOGIN_ATTEMPTS_SCRIPT,
} from '../../common/constants/auth.constants.js';
import { hashKey } from '../../common/utils/hash-key.util.js';
import { REDIS_CLIENT } from '../../redis/redis.constants.js';
import { LoginAttemptsService } from './login-attempts.service.js';

describe('LoginAttemptsService', () => {
  const email = 'jane@example.com';
  const key = `${LOGIN_ATTEMPTS_KEY_PREFIX}${hashKey(email)}`;
  let service: LoginAttemptsService;
  const redis = {
    defineCommand: vi.fn(),
    recordLoginAttempt: vi.fn(),
    resetLoginAttempts: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    redis.resetLoginAttempts.mockResolvedValue(1);
    const moduleRef = await Test.createTestingModule({
      providers: [
        LoginAttemptsService,
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();
    service = moduleRef.get(LoginAttemptsService);
  });

  it('does not store the raw email in the key', () => {
    expect(key).not.toContain(email);
  });

  it('registers the atomic Lua commands', () => {
    expect(redis.defineCommand).toHaveBeenCalledWith(
      RECORD_LOGIN_ATTEMPT_COMMAND,
      {
        numberOfKeys: LOGIN_ATTEMPTS_KEY_COUNT,
        lua: RECORD_LOGIN_ATTEMPT_SCRIPT,
      },
    );
    expect(redis.defineCommand).toHaveBeenCalledWith(
      RESET_LOGIN_ATTEMPTS_COMMAND,
      {
        numberOfKeys: LOGIN_ATTEMPTS_KEY_COUNT,
        lua: RESET_LOGIN_ATTEMPTS_SCRIPT,
      },
    );
  });

  it('records the attempt and returns the count', async () => {
    redis.recordLoginAttempt.mockResolvedValueOnce(3);

    expect(await service.recordAttempt(email)).toBe(3);
    expect(redis.recordLoginAttempt).toHaveBeenCalledWith(
      key,
      LOGIN_ATTEMPT_WINDOW_SECONDS,
      LOGIN_LOCK_SECONDS,
      LOGIN_MAX_FAILED_ATTEMPTS,
    );
  });

  it('only clears attempts not exceeded by newer requests', async () => {
    await service.reset(email, 3);

    expect(redis.resetLoginAttempts).toHaveBeenCalledWith(key, 3);
  });

  it('does not fail the login when the reset fails', async () => {
    redis.resetLoginAttempts.mockRejectedValueOnce(new Error('redis down'));

    await expect(service.reset(email, 1)).resolves.toBeUndefined();
  });
});
