import type { ReactNode } from 'react';
import { usePermissions } from './usePermissions';

/**
 * Declarative UI permission gate (CLAUDE.md §10). Renders children only when the user has
 * the required permission(s)/role; otherwise renders `fallback` (default: nothing).
 *
 *   <Can permission="invoice:create"><Button …/></Can>
 *   <Can anyOf={['invoice:edit','invoice:approve']} fallback={<Locked/>}>…</Can>
 */
export interface CanProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  role?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({ permission, anyOf, allOf, role, fallback = null, children }: CanProps) {
  const { has, hasAny, hasAll, hasRole } = usePermissions();

  const checks: boolean[] = [];
  if (permission) checks.push(has(permission));
  if (anyOf) checks.push(hasAny(anyOf));
  if (allOf) checks.push(hasAll(allOf));
  if (role) checks.push(hasRole(role));

  // If no constraint was provided, default to allowed (acts as a passthrough).
  const allowed = checks.length === 0 || checks.every(Boolean);

  return <>{allowed ? children : fallback}</>;
}
