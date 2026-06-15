/**
 * Minimal JWT claim reader (CLAUDE.md §10). The client only *reads* claims for identity/tenant
 * — it never verifies the signature (the server is the authority). Used to derive userId,
 * tenantId, and roles from the access token returned by login.
 */
export interface AccessTokenClaims {
  sub: string;
  tenantId: string;
  roles: string[];
  type?: string;
  iss?: string;
  iat?: number;
  exp?: number;
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

export function decodeAccessToken(token: string): AccessTokenClaims | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    const claims = JSON.parse(json) as Partial<AccessTokenClaims>;
    if (typeof claims.sub !== 'string' || typeof claims.tenantId !== 'string') return null;
    return {
      sub: claims.sub,
      tenantId: claims.tenantId,
      roles: Array.isArray(claims.roles) ? claims.roles : [],
      ...(claims.type !== undefined ? { type: claims.type } : {}),
      ...(claims.iss !== undefined ? { iss: claims.iss } : {}),
      ...(claims.iat !== undefined ? { iat: claims.iat } : {}),
      ...(claims.exp !== undefined ? { exp: claims.exp } : {}),
    };
  } catch {
    return null;
  }
}

/** True when the token has no exp or is at/after expiry (with a small skew). */
export function isAccessTokenExpired(claims: AccessTokenClaims, skewMs = 5_000): boolean {
  if (!claims.exp) return true;
  return claims.exp * 1000 - skewMs <= Date.now();
}
