import type { ReactNode } from 'react';

/** A single selectable option. `value` is the stable key; `label` is what's shown. */
export interface DropdownOption<T extends string | number = string> {
  value: T;
  label: string;
  /** Optional secondary line (e.g. GSTIN, city). */
  sublabel?: string;
}

export interface DropdownProps<T extends string | number = string> {
  options: DropdownOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  /** Accessible name for the trigger (required when there's no visible label). */
  ariaLabel?: string;
  leadingIcon?: ReactNode;
  size?: 'sm' | 'md';
  disabled?: boolean;
  fullWidth?: boolean;
  'data-testid'?: string;
}
