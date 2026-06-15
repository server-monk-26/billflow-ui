/**
 * DEV-ONLY login stub. Backend integration is intentionally deferred — `Login` uses this to
 * establish a session entirely client-side (no HTTP). Replace with the real RTK Query login
 * mutation when wiring the backend (see git history for the API-integrated version).
 */
export interface DevSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  userId: string;
  tenantId: string;
  roles: string[];
}

function base64Url(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Builds a decodable (unsigned) mock JWT so the existing decode/rehydrate paths keep working. */
export function createDevSession(): DevSession {
  const userId = 'dev-user-001';
  const tenantId = 'dev-tenant-acme';
  const roles = ['ADMIN'];
  const now = Math.floor(Date.now() / 1000);
  const accessToken = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({
    sub: userId,
    tenantId,
    roles,
    type: 'access',
    iss: 'billflow-dev',
    iat: now,
    exp: now + 1800,
  })}.dev`;
  return { accessToken, refreshToken: 'dev-refresh-token', sessionId: 'dev-session', userId, tenantId, roles };
}
