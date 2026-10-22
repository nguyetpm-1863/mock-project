import { requireEnv } from '../../config/require-env.js';
import { DEFAULT_RATE_LIMIT_WINDOW_MS } from './app.constants.js';

export const AUTH_THROTTLE = {
  default: {
    limit: () => Number(requireEnv('AUTH_RATE_LIMIT')),
    ttl: DEFAULT_RATE_LIMIT_WINDOW_MS,
  },
};
