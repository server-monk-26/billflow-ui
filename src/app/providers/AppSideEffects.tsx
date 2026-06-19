import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { apiBridge, requestContext, baseApi } from '@/shared/api';
import { loggedOut, sessionRehydrated, clearSignup, tokenStorage } from '@/shared/auth';
import { clearCurrentUser, selectCurrentUser, selectTenant } from '@/shared/currentUser';
import { selectLocale, pushToast } from '@/shared/theme';
import { logger } from '@/shared/logger';
import { i18n } from '@/shared/i18n';

/**
 * Wires cross-cutting side effects without coupling the transport to the store (CLAUDE.md
 * §9, §17): rehydrates the session from token storage on reload, keeps requestContext/logger/i18n
 * in sync, and registers the apiBridge handlers the axios interceptor calls on auth failure / error.
 */
export function AppSideEffects({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const locale = useAppSelector(selectLocale);
  const tenantId = useAppSelector((s) => selectTenant(s)?.id);
  const userId = useAppSelector((s) => selectCurrentUser(s)?.id);

  // Rehydrate the authenticated session from storage on reload; /me is re-fetched by the shell.
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const sessionId = tokenStorage.getSessionId();
    if (accessToken && refreshToken && sessionId) {
      dispatch(sessionRehydrated({ accessToken, refreshToken, sessionId }));
    }
    // Boot-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the interceptor's locale and the logger context current.
  useEffect(() => {
    requestContext.set({ locale });
    logger.setContext({ ...(tenantId ? { tenantId } : {}), ...(userId ? { userId } : {}) });
  }, [locale, tenantId, userId]);

  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [locale]);

  // Register transport → app handlers once.
  useEffect(() => {
    apiBridge.registerAuthFailureHandler(() => {
      tokenStorage.clear();
      dispatch(loggedOut());
      dispatch(clearCurrentUser());
      dispatch(clearSignup());
      // Reset server cache so no user data bleeds into the next session (§11).
      dispatch(baseApi.util.resetApiState());
    });
    apiBridge.registerErrorHandler((error) => {
      // 401s are handled by the refresh/logout flow; don't double-toast them.
      if (error.status === 401) return;
      dispatch(pushToast({ variant: 'error', message: error.message }));
    });
  }, [dispatch]);

  return <>{children}</>;
}
