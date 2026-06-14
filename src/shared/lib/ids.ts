/** Pure id helpers (no React). Used for correlation ids, optimistic keys, etc. */

/** RFC4122-ish unique id, using crypto.randomUUID when available. */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Short correlation id for request tracing / logs. */
export function correlationId(): string {
  return uuid();
}
