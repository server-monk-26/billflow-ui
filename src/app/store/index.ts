import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/shared/api';
import { authReducer } from '@/shared/auth';
import { tenantReducer } from '@/shared/tenant';
import { uiReducer, persistUi } from '@/shared/theme';
import { auditMiddleware } from '@/shared/audit';

/**
 * Composition root for global state (CLAUDE.md §8). One store; server state lives in the
 * single baseApi cache, global client state in slices. Adds the audit middleware (§16.3).
 */
const rootReducer = combineReducers({
  ui: uiReducer,
  auth: authReducer,
  tenant: tenantReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** Store factory — used by the singleton below and by tests for isolated state. */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware, auditMiddleware),
    ...(preloadedState ? { preloadedState: preloadedState as RootState } : {}),
  });
}

export const store = makeStore();
export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

// Enables refetchOnFocus / refetchOnReconnect behaviors for RTK Query.
setupListeners(store.dispatch);

// Persist durable UI prefs (theme axes + locale) on change.
let lastUi = store.getState().ui;
store.subscribe(() => {
  const nextUi = store.getState().ui;
  if (nextUi !== lastUi) {
    lastUi = nextUi;
    persistUi(nextUi);
  }
});
