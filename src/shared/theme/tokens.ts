/**
 * Typed mirror of the design-token axes (Design Spec §11). The CSS in tokens.css
 * is the runtime source of truth; this file is the TS source of truth for the
 * *axis values* so the ui slice, ThemeProvider, and MUI adapter stay in sync.
 */

export const THEME_MODES = ['light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const ACCENTS = ['rose', 'indigo', 'emerald', 'amber'] as const;
export type Accent = (typeof ACCENTS)[number];

export const DENSITIES = ['compact', 'comfortable'] as const;
export type Density = (typeof DENSITIES)[number];

export const RADII = ['sharp', 'normal', 'round'] as const;
export type Radius = (typeof RADII)[number];

export const SIDEBARS = ['labeled', 'icon'] as const;
export type SidebarMode = (typeof SIDEBARS)[number];

export const FONTS = ['geist', 'plex', 'manrope'] as const;
export type FontChoice = (typeof FONTS)[number];

/** One oklch hue per accent — mirrors tokens.css for any JS-side color needs. */
export const ACCENT_HUE: Record<Accent, number> = {
  rose: 14,
  indigo: 264,
  emerald: 162,
  amber: 70,
};

export interface ThemeAxes {
  mode: ThemeMode;
  accent: Accent;
  density: Density;
  radius: Radius;
  sidebar: SidebarMode;
  font: FontChoice;
}

export const DEFAULT_AXES: ThemeAxes = {
  mode: 'light',
  accent: 'rose',
  density: 'compact',
  radius: 'normal',
  sidebar: 'labeled',
  font: 'geist',
};

/** Maps an axis key to the `data-*` attribute it controls on the document root. */
export const AXIS_ATTR = {
  mode: 'data-theme',
  accent: 'data-accent',
  density: 'data-density',
  radius: 'data-radius',
  sidebar: 'data-sidebar',
  font: 'data-font',
} as const satisfies Record<keyof ThemeAxes, string>;

/** Read a resolved CSS custom property value at runtime (e.g. for charts). */
export function cssVar(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
