/**
 * The single place tokens are read/written (CLAUDE.md §10). No scattered storage calls.
 *
 * Token model (per the backend): the login response returns access + refresh tokens and a
 * session id in the body — there is no httpOnly refresh cookie. Tokens are therefore
 * client-stored:
 * - Access token: in memory (lowest XSS exposure), mirrored to sessionStorage so a reload
 *   survives without forcing re-login.
 * - Refresh token + session id: sessionStorage. NOTE: client-stored refresh tokens carry an
 *   XSS risk; mitigated by sessionStorage (cleared on tab close) + strict CSP/output encoding.
 *
 * The axios request interceptor reads the access token here synchronously on every request.
 */

const ACCESS_KEY = 'billflow.at';
const REFRESH_KEY = 'billflow.rt';
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
  getRefreshToken(): string | null {
    return safeGet(REFRESH_KEY);
  },
  setRefreshToken(token: string | null): void {
    safeSet(REFRESH_KEY, token);
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
    safeSet(REFRESH_KEY, null);
    safeSet(SESSION_KEY, null);
  },
};
