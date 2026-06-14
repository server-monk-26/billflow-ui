/**
 * The single place tokens are read/written (CLAUDE.md §10). No scattered storage calls.
 *
 * Decision (confirmed): the refresh token lives in an httpOnly, Secure, SameSite cookie set
 * by the backend — JS cannot read it, so there is no refresh-token API here. The browser
 * sends it automatically on the refresh request (axios `withCredentials: true`).
 *
 * - Access token: in memory only (lowest XSS exposure). Mirrored to sessionStorage so a
 *   page reload survives without forcing re-login; clear on logout.
 * - Session id: sessionStorage, sent as X-Session-Id by the request interceptor.
 */

const ACCESS_KEY = 'billflow.at';
const SESSION_KEY = 'billflow.sid';

let accessToken: string | null = null;

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (accessToken !== null) return accessToken;
    accessToken = safeGet(ACCESS_KEY);
    return accessToken;
  },
  setAccessToken(token: string | null): void {
    accessToken = token;
    safeSet(ACCESS_KEY, token);
  },
  getSessionId(): string | null {
    return safeGet(SESSION_KEY);
  },
  setSessionId(id: string | null): void {
    safeSet(SESSION_KEY, id);
  },
  clear(): void {
    accessToken = null;
    safeSet(ACCESS_KEY, null);
    safeSet(SESSION_KEY, null);
  },
};
