import { createHash } from 'node:crypto';
import {
  KEY_HASH_ALGORITHM,
  KEY_HASH_ENCODING,
} from '../constants/crypto.constants.js';

export const hashKey = (value: string): string =>
  createHash(KEY_HASH_ALGORITHM).update(value).digest(KEY_HASH_ENCODING);
