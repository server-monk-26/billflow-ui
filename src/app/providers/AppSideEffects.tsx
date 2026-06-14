import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { apiBridge, requestContext } from '@/shared/api';
import { loggedOut } from '@/shared/auth';
import { tokenStorage } from '@/shared/auth';
import { selectActiveTenantId, clearTenant } from '@/shared/tenant';
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
  const userId = useAppSelector((s) => s.auth.user?.id ?? undefined);

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
