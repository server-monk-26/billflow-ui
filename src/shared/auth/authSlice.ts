import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MenuItem, Session, User } from './schemas';

/**
 * Auth slice (CLAUDE.md §8, §10) — holds identity, server-driven roles/permissions,
 * menus, and feature-flag overrides. The access-token *value* used by the transport
 * lives in tokenStorage (synchronously readable by the axios interceptor); this slice
 * mirrors auth status for the UI. Permissions are dynamic — never hard-coded (§16.2).
 */

export type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  roles: string[];
  permissions: string[];
  tenantId: string | null;
  menus: MenuItem[];
  featureFlags: Record<string, boolean>;
}

const initialState: AuthState = {
  status: 'unauthenticated',
  user: null,
  roles: [],
  permissions: [],
  tenantId: null,
  menus: [],
  featureFlags: {},
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticating(state) {
      state.status = 'authenticating';
    },
    sessionEstablished(state, action: PayloadAction<Session>) {
      const { user, roles, permissions, tenantId, menus, featureFlags } = action.payload;
      state.status = 'authenticated';
      state.user = user;
      state.roles = roles;
      state.permissions = permissions;
      state.tenantId = tenantId;
      state.menus = menus;
      state.featureFlags = featureFlags;
    },
    loggedOut() {
      return initialState;
    },
  },
});

export const { authenticating, sessionEstablished, loggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;

/** Selectors typed against a minimal state shape so shared code stays decoupled from app. */
export interface WithAuth {
  auth: AuthState;
}
export const selectAuth = (s: WithAuth): AuthState => s.auth;
export const selectIsAuthenticated = (s: WithAuth): boolean => s.auth.status === 'authenticated';
export const selectCurrentUser = (s: WithAuth): User | null => s.auth.user;
export const selectPermissions = (s: WithAuth): string[] => s.auth.permissions;
export const selectRoles = (s: WithAuth): string[] => s.auth.roles;
export const selectMenus = (s: WithAuth): MenuItem[] => s.auth.menus;
