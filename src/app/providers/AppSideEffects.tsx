import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { apiBridge, requestContext } from '@/shared/api';
import {
  decodeAccessToken,
  isAccessTokenExpired,
  loggedOut,
  loginSucceeded,
  selectUserId,
  tokenStorage,
} from '@/shared/auth';
import { selectActiveTenantId, clearTenant, setActiveTenant } from '@/shared/tenant';
import { clearOrg } from '@/shared/org';
import { selectLocale, pushToast } from '@/shared/theme';
import { logger } from '@/shared/logger';
import { i18n } from '@/shared/i18n';
import { baseApi } from '@/shared/api';

/**
 * Wires cross-cutting side effects without coupling the transport to the store (CLAUDE.md
 * §9, §17). Keeps requestContext/logger/i18n in sync with state, and registers the apiBridge
 * handlers the axios interceptor calls on auth failure / error.
 */
export function AppSideEffects({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const tenantId = useAppSelector(selectActiveTenantId);
  const locale = useAppSelector(selectLocale);
  const userId = useAppSelector(selectUserId) ?? undefined;

  // Rehydrate the session from storage on boot so a reload survives (tokens are client-stored).
  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const sessionId = tokenStorage.getSessionId();
    if (!accessToken || !refreshToken || !sessionId) return;

    const claims = decodeAccessToken(accessToken);
    if (!claims || isAccessTokenExpired(claims)) {
      tokenStorage.clear();
      return;
    }
    dispatch(
      loginSucceeded({
        tokens: { accessToken, refreshToken, sessionId },
        userId: claims.sub,
        tenantId: claims.tenantId,
        roles: claims.roles,
      }),
    );
    dispatch(setActiveTenant({ id: claims.tenantId, name: claims.tenantId }));
    // Boot-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the interceptor's ambient context and the logger context current.
  useEffect(() => {
    requestContext.set({ tenantId, locale });
    logger.setContext({ ...(tenantId ? { tenantId } : {}), ...(userId ? { userId } : {}) });
  }, [tenantId, locale, userId]);

  // Keep i18n language in sync with the ui slice locale.
  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [locale]);

  // Register transport → app handlers once.
  useEffect(() => {
    apiBridge.registerAuthFailureHandler(() => {
      tokenStorage.clear();
      dispatch(loggedOut());
      dispatch(clearTenant());
      dispatch(clearOrg());
      // Reset server cache so no tenant/user data bleeds into the next session (§11).
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
