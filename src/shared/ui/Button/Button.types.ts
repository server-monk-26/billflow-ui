import type { ReactNode } from 'react';

/** Variants map to the design spec's button recipes (§09): Primary, Secondary, Ghost, Danger. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  /** Test/automation hook. */
  'data-testid'?: string;
}
