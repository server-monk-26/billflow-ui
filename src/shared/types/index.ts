/** Shared/global types used across features. Keep feature-specific types in the feature. */

/** Discriminated async status (CLAUDE.md §5 — prefer unions over boolean flags). */
export type AsyncStatus = 'idle' | 'loading' | 'error' | 'success';

/** Standard server-paginated list envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
