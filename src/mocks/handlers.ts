import { http, HttpResponse } from 'msw';
import { config } from '@/config';

/**
 * MSW request handlers (CLAUDE.md §18 — mock API for tests and local dev). Add per-feature
 * handlers here (or compose feature handler arrays) as features land. Unhandled requests are
 * bypassed to the network (see worker start options).
 */
export const handlers = [
  // Example: token refresh stub so the 401→refresh flow can be exercised locally.
  http.post(`${config.api.baseUrl}/auth/refresh`, () =>
    HttpResponse.json({ accessToken: 'dev.refreshed.token', sessionId: 'dev-session' }),
  ),
];
