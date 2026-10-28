import type { SortDirection } from './sort-direction.type.js';

export interface ParsedSort<T extends string> {
  field: T;
  direction: SortDirection;
}
