import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import type { ButtonProps, ButtonVariant } from './Button.types';

/**
 * App Button (CLAUDE.md §6.1) — wraps MUI so feature code never imports the UI library.
 * Props are designed for BillFlow, not leaking MUI's surface. Themed via tokens (radius,
 * row height, accent) so it inherits every data-* axis automatically.
 */
const VARIANT_MAP: Record<
  ButtonVariant,
  { variant: NonNullable<MuiButtonProps['variant']>; color: NonNullable<MuiButtonProps['color']> }
> = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined', color: 'primary' },
  ghost: { variant: 'text', color: 'primary' },
  danger: { variant: 'contained', color: 'error' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  startIcon,
  endIcon,
  onClick,
  'data-testid': testId,
}: ButtonProps) {
  const { variant: muiVariant, color } = VARIANT_MAP[variant];

  return (
    <MuiButton
      variant={muiVariant}
      color={color}
      size={size === 'sm' ? 'small' : 'medium'}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      type={type}
      onClick={onClick}
      startIcon={loading ? undefined : startIcon}
      endIcon={loading ? undefined : endIcon}
      data-testid={testId}
    >
      {loading ? <CircularProgress size={16} color="inherit" aria-label="loading" /> : children}
    </MuiButton>
  );
}
