import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MenuItem, User } from './schemas';

/**
 * Auth slice (CLAUDE.md §8, §10). Holds the auth tokens (access/refresh/session — client-stored
 * per the backend), the identity derived from the access-token claims (userId/tenantId/roles),
 * and the fuller profile (user/permissions/menus) once it's fetched. Permissions are dynamic —
 * never hard-coded (§16.2). The token *value* the transport uses is also kept in tokenStorage so
 * the axios interceptor can read it synchronously.
 */

export type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn?: number;
}

export interface AuthState {
  status: AuthStatus;
  tokens: AuthTokens | null;
  userId: string | null;
  tenantId: string | null;
  roles: string[];
  user: User | null;
  permissions: string[];
  menus: MenuItem[];
  featureFlags: Record<string, boolean>;
}

const initialState: AuthState = {
  status: 'unauthenticated',
  tokens: null,
  userId: null,
  tenantId: null,
  roles: [],
  user: null,
  permissions: [],
  menus: [],
  featureFlags: {},
};

export interface LoginSucceededPayload {
  tokens: AuthTokens;
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface ProfileLoadedPayload {
  user: User;
  roles: string[];
  permissions: string[];
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticating(state) {
      state.status = 'authenticating';
    },
    /** Set after a successful login (tokens + identity from the JWT claims). */
    loginSucceeded(state, action: PayloadAction<LoginSucceededPayload>) {
      const { tokens, userId, tenantId, roles } = action.payload;
      state.status = 'authenticated';
      state.tokens = tokens;
      state.userId = userId;
      state.tenantId = tenantId;
      state.roles = roles;
    },
    /** Fill the richer profile once /me is fetched (user + server-driven roles/permissions). */
    profileLoaded(state, action: PayloadAction<ProfileLoadedPayload>) {
      const { user, roles, permissions } = action.payload;
      state.user = user;
      state.roles = roles;
      state.permissions = permissions;
    },
    loggedOut() {
      return initialState;
    },
  },
});

export const { authenticating, loginSucceeded, profileLoaded, loggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;

/** Selectors typed against a minimal state shape so shared code stays decoupled from app. */
export interface WithAuth {
  auth: AuthState;
}
export const selectAuth = (s: WithAuth): AuthState => s.auth;
export const selectIsAuthenticated = (s: WithAuth): boolean => s.auth.status === 'authenticated';
export const selectCurrentUser = (s: WithAuth): User | null => s.auth.user;
export const selectUserId = (s: WithAuth): string | null => s.auth.userId;
export const selectPermissions = (s: WithAuth): string[] => s.auth.permissions;
export const selectRoles = (s: WithAuth): string[] => s.auth.roles;
export const selectMenus = (s: WithAuth): MenuItem[] => s.auth.menus;
export const selectTokens = (s: WithAuth): AuthTokens | null => s.auth.tokens;
