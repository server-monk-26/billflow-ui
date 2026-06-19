import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/shared/auth';
import { selectPermissions, selectRoles } from '@/shared/currentUser';

/**
 * Dynamic-permission primitive (CLAUDE.md §10, §16.2). Reads server-driven roles/permissions
 * from the currentUser store (GET /me). Adding a new permission requires zero front-end changes
 * for gating that already uses these helpers. The client gate is UX only — the server is authority.
 */
export interface PermissionApi {
  isAuthenticated: boolean;
  has: (permission: string) => boolean;
  hasAny: (permissions: string[]) => boolean;
  hasAll: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

export function usePermissions(): PermissionApi {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const permissionSet = new Set(permissions);
  const roleSet = new Set(roles);

  return {
    isAuthenticated,
    has: (permission) => permissionSet.has(permission),
    hasAny: (perms) => perms.some((p) => permissionSet.has(p)),
    hasAll: (perms) => perms.every((p) => permissionSet.has(p)),
    hasRole: (role) => roleSet.has(role),
  };
}
