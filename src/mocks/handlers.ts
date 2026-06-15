import type { RequestHandler } from 'msw';

/**
 * MSW request handlers (CLAUDE.md §18 — mock API for tests and local dev). Empty for now:
 * backend integration is deferred and login runs as a client-side dev stub. Add per-feature
 * handlers here (e.g. the real `/auth/login`, `/auth/refresh`) when wiring the backend.
 * Unhandled requests are bypassed to the network (see worker/server start options).
 */
export const handlers: RequestHandler[] = [];
