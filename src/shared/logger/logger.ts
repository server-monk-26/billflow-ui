import { config } from '@/config';

/**
 * Centralized logger (CLAUDE.md §15). No raw `console.*` anywhere else — ESLint enforces it.
 * - Wraps `console` in development.
 * - In production, ships to a remote sink (config.logging.remoteUrl) if configured.
 * - Gated by the log level from config.
 * - Carries ambient context: correlationId, tenantId, userId, route.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export interface LogContext {
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  route?: string;
}

export interface LogEntry {
  level: Exclude<LogLevel, 'silent'>;
  message: string;
  timestamp: string;
  context: LogContext;
  data?: unknown;
}

let ambientContext: LogContext = {};

function shouldLog(level: Exclude<LogLevel, 'silent'>): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[config.logging.level];
}

function emit(level: Exclude<LogLevel, 'silent'>, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: { ...ambientContext },
    ...(data !== undefined ? { data } : {}),
  };

  // Local console output (the wrapped console — this file is the only place it's allowed).
  if (!config.app.isProduction) {
    const fn =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'info'
            ? console.info
            : console.debug;
    fn(`[${entry.level.toUpperCase()}] ${message}`, entry.context, data ?? '');
  }

  // Remote sink (Sentry/Datadog/custom). Fire-and-forget; never throw from the logger.
  if (config.logging.remoteUrl && (level === 'error' || level === 'warn')) {
    void shipToRemote(entry);
  }
}

async function shipToRemote(entry: LogEntry): Promise<void> {
  const url = config.logging.remoteUrl;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true,
    });
  } catch {
    // Swallow — logging must never break the app.
  }
}

export const logger = {
  /** Merge fields into the ambient context attached to every subsequent log. */
  setContext(ctx: Partial<LogContext>): void {
    ambientContext = { ...ambientContext, ...ctx };
  },
  /** Replace the ambient context entirely (e.g. on logout). */
  resetContext(): void {
    ambientContext = {};
  },
  getContext(): Readonly<LogContext> {
    return ambientContext;
  },
  debug: (message: string, data?: unknown) => emit('debug', message, data),
  info: (message: string, data?: unknown) => emit('info', message, data),
  warn: (message: string, data?: unknown) => emit('warn', message, data),
  error: (message: string, data?: unknown) => emit('error', message, data),
};

export type Logger = typeof logger;
