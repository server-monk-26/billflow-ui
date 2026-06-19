import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * `auth` global store (CLAUDE.md §8, §10) — the session/token state from the login and
 * change-password responses. Two response shapes are stored here:
 *   - SUCCESS                  → accessToken / refreshToken / sessionId / expiresIn (authenticated)
 *   - PASSWORD_CHANGE_REQUIRED → passwordChangeToken (not yet authenticated; gates reset-password)
 *
 * The token *values* are also mirrored to tokenStorage so the axios interceptor can read the
 * access token synchronously on every request. Identity/roles/permissions live in `currentUser`.
 */
export type LoginStatus = 'SUCCESS' | 'PASSWORD_CHANGE_REQUIRED';

/** Login / change-password response payload (data of the envelope). */
export interface AuthSession {
  status: LoginStatus;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  sessionId?: string | undefined;
  expiresIn?: number | undefined;
  passwordChangeToken?: string | undefined;
}

export interface AuthState {
  status: 'unauthenticated' | 'authenticated';
  loginStatus: LoginStatus | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  expiresIn: number | null;
  passwordChangeToken: string | null;
}

const initialState: AuthState = {
  status: 'unauthenticated',
  loginStatus: null,
  accessToken: null,
  refreshToken: null,
  sessionId: null,
  expiresIn: null,
  passwordChangeToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Store a login / change-password response (both response shapes). */
    sessionStored(state, action: PayloadAction<AuthSession>) {
      const s = action.payload;
      state.loginStatus = s.status;
      if (s.status === 'SUCCESS') {
        state.status = 'authenticated';
        state.accessToken = s.accessToken ?? null;
        state.refreshToken = s.refreshToken ?? null;
        state.sessionId = s.sessionId ?? null;
        state.expiresIn = s.expiresIn ?? null;
        state.passwordChangeToken = null;
      } else {
        // PASSWORD_CHANGE_REQUIRED — no tokens yet; hold the change-password token.
        state.status = 'unauthenticated';
        state.passwordChangeToken = s.passwordChangeToken ?? null;
      }
    },
    /** Rehydrate the authenticated session from token storage on reload. */
    sessionRehydrated(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; sessionId: string }>,
    ) {
      state.status = 'authenticated';
      state.loginStatus = 'SUCCESS';
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.sessionId = action.payload.sessionId;
    },
    loggedOut() {
      return initialState;
    },
  },
});

export const { sessionStored, sessionRehydrated, loggedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;

export interface WithAuth {
  auth: AuthState;
}
export const selectAuth = (s: WithAuth): AuthState => s.auth;
export const selectIsAuthenticated = (s: WithAuth): boolean => s.auth.status === 'authenticated';
export const selectAccessToken = (s: WithAuth): string | null => s.auth.accessToken;
export const selectRefreshToken = (s: WithAuth): string | null => s.auth.refreshToken;
export const selectAuthSessionId = (s: WithAuth): string | null => s.auth.sessionId;
export const selectPasswordChangeToken = (s: WithAuth): string | null => s.auth.passwordChangeToken;
export const selectLoginStatus = (s: WithAuth): LoginStatus | null => s.auth.loginStatus;
