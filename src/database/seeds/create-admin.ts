import { Logger } from '@nestjs/common';
import {
  ADMIN_CREATED_MESSAGE,
  ADMIN_PROMOTED_MESSAGE,
  SEED_ADMIN_LOG_CONTEXT,
} from '../../common/constants/role.constants.js';
import { requireEnv } from '../../config/require-env.js';
import dataSource from '../data-source.js';
import { seedAdmin } from './seed-admin.js';

await dataSource.initialize();
try {
  const result = await seedAdmin(dataSource, {
    email: requireEnv('ADMIN_EMAIL'),
    name: requireEnv('ADMIN_NAME'),
    password: requireEnv('ADMIN_PASSWORD'),
  });
  const message = result.created
    ? ADMIN_CREATED_MESSAGE
    : ADMIN_PROMOTED_MESSAGE;
  Logger.log(message, SEED_ADMIN_LOG_CONTEXT);
} finally {
  await dataSource.destroy();
}
