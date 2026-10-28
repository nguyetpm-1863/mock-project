import {
  CASE_INSENSITIVE_COLLATION,
  UNICODE_NORMALIZATION_FORM,
} from '../constants/search.constants.js';
import { containsPattern } from './escape-like.util.js';

export const lowerColumn = (column: string): string =>
  `LOWER(NORMALIZE(${column}, ${UNICODE_NORMALIZATION_FORM}) COLLATE "${CASE_INSENSITIVE_COLLATION}")`;

export const lowerContainsPattern = (value: string): string =>
  containsPattern(value.normalize(UNICODE_NORMALIZATION_FORM).toLowerCase());
