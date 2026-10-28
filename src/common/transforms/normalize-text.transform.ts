import type { TransformFnParams } from 'class-transformer';
import { UNICODE_NORMALIZATION_FORM } from '../constants/search.constants.js';

export const normalizeText = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string'
    ? value.trim().normalize(UNICODE_NORMALIZATION_FORM)
    : value;
