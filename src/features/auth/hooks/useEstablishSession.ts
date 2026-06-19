import { useCallback } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { sessionStored, loggedOut, tokenStorage, type AuthSession } from '@/shared/auth';
import { currentUserLoaded } from '@/shared/currentUser';
import { logger } from '@/shared/logger';
import { useLazyGetMeQuery } from '../api/authApi';
import type { Me } from '../model/meSchema';

/**
 * Establishes an authenticated session from a SUCCESS login / change-password response:
 * persists the tokens, stores them in the auth slice, then calls GET /me and stores the profile
 * in the currentUser slice. If /me fails the user is NOT let in (CLAUDE.md flow — blocked at
 * login); the session is rolled back and the caller surfaces the error.
 *
 * Returns the Me profile on success (so the caller can route by business status), or null on failure.
 */
export function useEstablishSession(): (session: AuthSession) => Promise<Me | null> {
  const dispatch = useAppDispatch();
  const [triggerMe] = useLazyGetMeQuery();

  return useCallback(
    async (session: AuthSession): Promise<Me | null> => {
      if (session.accessToken) tokenStorage.setAccessToken(session.accessToken);
      if (session.refreshToken) tokenStorage.setRefreshToken(session.refreshToken);
      if (session.sessionId) tokenStorage.setSessionId(session.sessionId);
      dispatch(sessionStored(session));

      try {
        const me = await triggerMe().unwrap();
        dispatch(currentUserLoaded(me));
        return me;
      } catch (err) {
        logger.error('GET /me failed after login; blocking sign-in', err);
        tokenStorage.clear();
        dispatch(loggedOut());
        return null;
      }
    },
    [dispatch, triggerMe],
  );
}
