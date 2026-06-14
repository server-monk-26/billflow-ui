import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router-dom';
import { logger } from '@/shared/logger';

/**
 * App-level error boundary (CLAUDE.md §12). Catches render-time errors, logs via the logger
 * (never console), and shows a recoverable fallback. Pair with the router's errorElement.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Render error caught by ErrorBoundary', {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorFallback />;
    }
    return this.props.children;
  }
}

export function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <div role="alert" style={fallbackStyle}>
      <h1 style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>{t('errors.boundary.title')}</h1>
      <p style={{ color: 'var(--text-2)' }}>{t('errors.boundary.body')}</p>
      <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
        {t('actions.retry')}
      </button>
    </div>
  );
}

/** Router errorElement variant — reads the thrown route error. */
export function RouteErrorElement() {
  const error = useRouteError();
  logger.error('Route error', { error: error instanceof Error ? error.message : String(error) });
  return <ErrorFallback />;
}

const fallbackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--sp-3)',
  minHeight: '60vh',
  textAlign: 'center',
  padding: 'var(--sp-6)',
};

const buttonStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  background: 'var(--accent)',
  color: 'var(--accent-contrast)',
  border: 'none',
  borderRadius: 'var(--r)',
  height: 'var(--row-h)',
  padding: '0 var(--sp-4)',
  cursor: 'pointer',
};
