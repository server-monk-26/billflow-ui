import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

/**
 * Loader (CLAUDE.md §6.1) — inline and full-page/overlay variants. Used by route Suspense
 * fallbacks (§12) and async UI. Color follows the accent token via MUI primary.
 */
export interface LoaderProps {
  variant?: 'inline' | 'overlay' | 'page';
  size?: number;
  label?: string;
}

export function Loader({ variant = 'inline', size = 20, label = 'Loading' }: LoaderProps) {
  if (variant === 'inline') {
    return <CircularProgress size={size} color="primary" role="status" aria-label={label} />;
  }

  return (
    <Box
      role="status"
      aria-label={label}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(variant === 'overlay'
          ? {
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--bg)',
              opacity: 0.7,
              zIndex: 10,
            }
          : { minHeight: '60vh', width: '100%' }),
      }}
    >
      <CircularProgress size={variant === 'page' ? 32 : size} color="primary" />
    </Box>
  );
}
