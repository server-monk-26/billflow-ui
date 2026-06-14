import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from './tokens';

/**
 * MUI theme built from the design tokens (CLAUDE.md §7, decision: "MUI themed from tokens").
 *
 * Two-layer strategy, because MUI's color engine (colorManipulator) can't parse CSS `var()`
 * or `oklch()`:
 *  1. The MUI *palette* uses concrete hex values that mirror the token neutrals/accents per
 *     mode, so createTheme + alpha()/lighten() work.
 *  2. Accent- and shape-driven surfaces use `var(--token)` in component styleOverrides, so the
 *     live data-* axes (accent, radius, density) still drive MUI components at runtime without
 *     recreating the theme. The default accent hex matches the rose token.
 */
interface PaletteTokens {
  primaryMain: string;
  primaryDark: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  bgDefault: string;
  bgPaper: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  divider: string;
}

// Hex mirrors of tokens.css (rose accent default). The live accent axis is applied via var()
// in styleOverrides below; these values are the parseable fallback MUI computes from.
const LIGHT: PaletteTokens = {
  primaryMain: '#e11d48',
  primaryDark: '#be123c',
  error: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
  info: '#2563eb',
  bgDefault: '#fafafa',
  bgPaper: '#ffffff',
  textPrimary: '#0a0a0a',
  textSecondary: '#525252',
  textDisabled: '#8a8a8a',
  divider: '#e7e7e7',
};

const DARK: PaletteTokens = {
  primaryMain: '#fb7185',
  primaryDark: '#f43f5e',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#3b82f6',
  bgDefault: '#0a0a0a',
  bgPaper: '#131313',
  textPrimary: '#fafafa',
  textSecondary: '#a3a3a3',
  textDisabled: '#707070',
  divider: '#232323',
};

export function buildMuiTheme(mode: ThemeMode): Theme {
  const c = mode === 'dark' ? DARK : LIGHT;

  return createTheme({
    palette: {
      mode,
      primary: { main: c.primaryMain, dark: c.primaryDark, contrastText: '#ffffff' },
      success: { main: c.success },
      warning: { main: c.warning },
      error: { main: c.error },
      info: { main: c.info },
      background: { default: c.bgDefault, paper: c.bgPaper },
      text: { primary: c.textPrimary, secondary: c.textSecondary, disabled: c.textDisabled },
      divider: c.divider,
    },
    typography: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      htmlFontSize: 16,
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 6 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '.mono': { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 'var(--r)', minHeight: 'var(--row-h)' },
          // Accent axis applied live via tokens.
          containedPrimary: {
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)',
            '&:hover': { backgroundColor: 'var(--accent-hover)' },
          },
          outlinedPrimary: { color: 'var(--accent)', borderColor: 'var(--accent)' },
          textPrimary: { color: 'var(--accent)' },
        },
      },
      MuiCircularProgress: {
        styleOverrides: { colorPrimary: { color: 'var(--accent)' } },
      },
      MuiOutlinedInput: {
        styleOverrides: { root: { borderRadius: 'var(--r)' } },
      },
      MuiPaper: {
        styleOverrides: { rounded: { borderRadius: 'var(--r-lg)' } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 'var(--r-sm)' } },
      },
    },
  });
}
