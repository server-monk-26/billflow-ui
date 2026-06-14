import { createSelector, createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { config } from '@/config';
import {
  DEFAULT_AXES,
  type Accent,
  type Density,
  type FontChoice,
  type Radius,
  type SidebarMode,
  type ThemeAxes,
  type ThemeMode,
} from './tokens';

/**
 * Global UI slice (CLAUDE.md §8) — theme axes, active locale, and transient toasts.
 * Theme axes + locale are persisted; toasts are not. ThemeProvider reads the axes
 * from here and applies them as data-* attributes on the document root.
 */

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  /** Optional i18n key; when set, `message` is treated as a fallback. */
  messageKey?: string;
  durationMs?: number;
}

export interface UiState extends ThemeAxes {
  locale: string;
  toasts: Toast[];
}

const PERSIST_KEY = 'billflow.ui';

type PersistedUi = Partial<ThemeAxes> & { locale?: string };

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function loadPersisted(): PersistedUi {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? (JSON.parse(raw) as PersistedUi) : {};
  } catch {
    return {};
  }
}

function buildInitialState(): UiState {
  const persisted = loadPersisted();
  return {
    mode: persisted.mode ?? (systemPrefersDark() ? 'dark' : DEFAULT_AXES.mode),
    accent: persisted.accent ?? DEFAULT_AXES.accent,
    density: persisted.density ?? DEFAULT_AXES.density,
    radius: persisted.radius ?? DEFAULT_AXES.radius,
    sidebar: persisted.sidebar ?? DEFAULT_AXES.sidebar,
    font: persisted.font ?? DEFAULT_AXES.font,
    locale: persisted.locale ?? config.i18n.defaultLocale,
    toasts: [],
  };
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: buildInitialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleThemeMode(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setAccent(state, action: PayloadAction<Accent>) {
      state.accent = action.payload;
    },
    setDensity(state, action: PayloadAction<Density>) {
      state.density = action.payload;
    },
    setRadius(state, action: PayloadAction<Radius>) {
      state.radius = action.payload;
    },
    setSidebarMode(state, action: PayloadAction<SidebarMode>) {
      state.sidebar = action.payload;
    },
    toggleSidebar(state) {
      state.sidebar = state.sidebar === 'labeled' ? 'icon' : 'labeled';
    },
    setFont(state, action: PayloadAction<FontChoice>) {
      state.font = action.payload;
    },
    setLocale(state, action: PayloadAction<string>) {
      state.locale = action.payload;
    },
    pushToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare(toast: Omit<Toast, 'id'>) {
        return { payload: { id: nanoid(), ...toast } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  setThemeMode,
  toggleThemeMode,
  setAccent,
  setDensity,
  setRadius,
  setSidebarMode,
  toggleSidebar,
  setFont,
  setLocale,
  pushToast,
  dismissToast,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;

/** Selectors typed against a minimal shape so shared code stays decoupled from app. */
export interface WithUi {
  ui: UiState;
}
export const selectUi = (s: WithUi): UiState => s.ui;
export const selectThemeMode = (s: WithUi): ThemeMode => s.ui.mode;
/** Memoized so it returns a stable reference unless an axis actually changes. */
export const selectThemeAxes = createSelector(
  [
    (s: WithUi) => s.ui.mode,
    (s: WithUi) => s.ui.accent,
    (s: WithUi) => s.ui.density,
    (s: WithUi) => s.ui.radius,
    (s: WithUi) => s.ui.sidebar,
    (s: WithUi) => s.ui.font,
  ],
  (mode, accent, density, radius, sidebar, font): ThemeAxes => ({
    mode,
    accent,
    density,
    radius,
    sidebar,
    font,
  }),
);
export const selectLocale = (s: WithUi): string => s.ui.locale;
export const selectToasts = (s: WithUi): Toast[] => s.ui.toasts;

/** Persist only the durable parts of UI state (called from a store subscriber). */
export function persistUi(state: UiState): void {
  try {
    const toSave: PersistedUi = {
      mode: state.mode,
      accent: state.accent,
      density: state.density,
      radius: state.radius,
      sidebar: state.sidebar,
      font: state.font,
      locale: state.locale,
    };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage failures (private mode, quota).
  }
}
