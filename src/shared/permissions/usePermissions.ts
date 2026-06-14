import { useSelector } from 'react-redux';
import { selectPermissions, selectRoles, selectIsAuthenticated } from '@/shared/auth';

/**
 * Dynamic-permission primitive (CLAUDE.md §10, §16.2). Reads server-driven permissions
 * from the auth slice. Adding a new permission requires zero front-end changes for gating
 * that already uses these helpers. The client gate is UX only — the server is the authority.
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
