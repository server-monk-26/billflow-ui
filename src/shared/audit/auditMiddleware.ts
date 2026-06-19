import type { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { selectCurrentUser, selectTenant, type WithCurrentUser } from '@/shared/currentUser';
import { audit } from './audit';

/**
 * Redux middleware that records whitelisted actions to the audit log (CLAUDE.md §16.3).
 * Add action types to AUDITED_ACTIONS to capture them. The API interceptor separately
 * captures mutating HTTP requests; this covers meaningful client-side state transitions.
 */
const AUDITED_ACTIONS = new Set<string>([
  'auth/sessionStored',
  'auth/loggedOut',
  'currentUser/currentUserLoaded',
]);

export const auditMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const type = (action as UnknownAction).type;

  if (typeof type === 'string' && AUDITED_ACTIONS.has(type)) {
    const state = store.getState() as WithCurrentUser;
    const actor = selectCurrentUser(state)?.id;
    const tenant = selectTenant(state)?.id;
    audit.record({
      action: type,
      ...(actor ? { actor } : {}),
      ...(tenant ? { tenant } : {}),
    });
  }

  return result;
};
