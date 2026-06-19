import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { loggedOut, selectIsAuthenticated, tokenStorage } from '@/shared/auth';
import { currentUserLoaded, selectCurrentUserLoaded } from '@/shared/currentUser';
import { logger } from '@/shared/logger';
import { useLazyGetMeQuery } from '../api/authApi';

/**
 * Ensures the currentUser store is populated for an authenticated session — used by the app
 * shell and onboarding so a reload / direct navigation re-fetches GET /me (the login flow
 * already loads it via useEstablishSession). If /me fails the session is dropped (blocked).
 */
export function useLoadCurrentUser(): void {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loaded = useAppSelector(selectCurrentUserLoaded);
  const [triggerMe] = useLazyGetMeQuery();
  const requested = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || loaded || requested.current) return;
    requested.current = true;
    void (async () => {
      try {
        const me = await triggerMe().unwrap();
        dispatch(currentUserLoaded(me));
      } catch (err) {
        logger.error('GET /me failed; signing out', err);
        tokenStorage.clear();
        dispatch(loggedOut());
      } finally {
        requested.current = false;
      }
    })();
  }, [isAuthenticated, loaded, dispatch, triggerMe]);
}
