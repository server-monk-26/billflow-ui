import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePermissions } from './usePermissions';

/**
 * Route guard (CLAUDE.md §10, §12). Gates routes by authentication and permission.
 * Unauthenticated → redirect to /login (preserving intended path); authenticated but
 * lacking permission → /403. Use as a layout route wrapping protected children, or pass
 * `children` directly. Server remains the real authority; this is UX/navigation gating.
 */
export interface ProtectedRouteProps {
  permission?: string;
  anyOf?: string[];
  role?: string;
  children?: ReactNode;
  loginPath?: string;
  forbiddenPath?: string;
}

export function ProtectedRoute({
  permission,
  anyOf,
  role,
  children,
  loginPath = '/login',
  forbiddenPath = '/403',
}: ProtectedRouteProps) {
  const { isAuthenticated, has, hasAny, hasRole } = usePermissions();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  const checks: boolean[] = [];
  if (permission) checks.push(has(permission));
  if (anyOf) checks.push(hasAny(anyOf));
  if (role) checks.push(hasRole(role));

  const allowed = checks.length === 0 || checks.every(Boolean);
  if (!allowed) {
    return <Navigate to={forbiddenPath} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
