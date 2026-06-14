import { useEffect, useMemo, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './tokens.css';
import { AXIS_ATTR, type ThemeAxes, type ThemeMode } from './tokens';
import { buildMuiTheme } from './muiTheme';
import { selectThemeAxes, selectThemeMode, setThemeMode, toggleThemeMode, type WithUi } from './uiSlice';

/**
 * ThemeProvider (CLAUDE.md §7). Reads the theme axes from the ui slice, reflects them as
 * data-* attributes on <html> (so tokens.css drives every CSS variable), and provides the
 * MUI theme built from those same tokens. Living in shared/theme keeps the MUI dependency
 * confined to the wrapper layer per §3.2.
 */
function applyAxes(axes: ThemeAxes): void {
  const root = document.documentElement;
  (Object.keys(AXIS_ATTR) as (keyof ThemeAxes)[]).forEach((key) => {
    root.setAttribute(AXIS_ATTR[key], axes[key]);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const axes = useSelector(selectThemeAxes);
  const theme = useMemo(() => buildMuiTheme(axes.mode), [axes.mode]);

  useEffect(() => {
    applyAxes(axes);
  }, [axes]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

/** Convenience hook for theme mode (CLAUDE.md §7 — useThemeMode + toggle). */
export function useThemeMode() {
  const mode = useSelector(selectThemeMode);
  const dispatch = useDispatch();
  return {
    mode,
    toggle: () => dispatch(toggleThemeMode()),
    setMode: (next: ThemeMode) => dispatch(setThemeMode(next)),
  };
}

// Re-export type so consumers don't need a separate import.
export type { WithUi };
