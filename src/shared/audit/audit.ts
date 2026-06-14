import { config } from '@/config';
import { logger } from '@/shared/logger';
import { axiosInstance } from '@/shared/api/axiosInstance';
import { correlationId } from '@/shared/lib';

/**
 * Audit logging (CLAUDE.md §16.3). `audit.record(event)` buffers events and flushes them
 * in batches to the backend. Never include sensitive payloads (tokens, passwords, PII
 * beyond policy) — pass only identifiers and action metadata.
 *
 * This is shared infrastructure, not a component, so it may use the axios transport directly.
 */

export interface AuditEvent {
  action: string;
  target?: string;
  /** Non-sensitive contextual metadata only. */
  meta?: Record<string, string | number | boolean>;
  actor?: string;
  tenant?: string;
  timestamp?: string;
  correlationId?: string;
}

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 10_000;

let buffer: AuditEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  try {
    await axiosInstance.post(config.audit.endpoint, { events: batch });
  } catch {
    logger.warn('Audit flush failed; dropping batch', { count: batch.length });
  }
}

function scheduleFlush(): void {
  timer ??= setTimeout(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);
}

export const audit = {
  record(event: AuditEvent): void {
    buffer.push({
      timestamp: new Date().toISOString(),
      correlationId: correlationId(),
      ...event,
    });
    if (buffer.length >= BATCH_SIZE) void flush();
    else scheduleFlush();
  },
  flush,
};
