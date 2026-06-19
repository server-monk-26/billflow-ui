import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { selectToasts, dismissToast, type Toast, type ToastVariant } from '@/shared/theme';

/**
 * Global toast host (CLAUDE.md §8 — global UI). Renders transient toasts from the ui slice and
 * auto-dismisses them. The API error handler and feature flows push toasts via `pushToast`.
 * Rendered once near the app root, inside the ThemeProvider so it inherits the design tokens.
 */
const VARIANT: Record<ToastVariant, { color: string; soft: string; Icon: typeof Info }> = {
  success: { color: 'var(--success)', soft: 'var(--success-soft)', Icon: CheckCircle2 },
  error: { color: 'var(--danger)', soft: 'var(--danger-soft)', Icon: XCircle },
  warning: { color: 'var(--warning)', soft: 'var(--warning-soft)', Icon: AlertTriangle },
  info: { color: 'var(--info)', soft: 'var(--info-soft)', Icon: Info },
};

export function Toaster() {
  const toasts = useSelector(selectToasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: 'var(--sp-4)',
        right: 'var(--sp-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-2)',
        zIndex: 1000,
        maxWidth: 380,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useDispatch();
  const { color, soft, Icon } = VARIANT[toast.variant];

  useEffect(() => {
    const ms = toast.durationMs ?? 5000;
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), ms);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id, toast.durationMs]);

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-3)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--r)',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text)',
        fontSize: 'var(--fs-label)',
      }}
    >
      <span style={{ display: 'grid', placeItems: 'center', width: 18, height: 18, color, background: soft, borderRadius: '50%', flex: 'none' }}>
        <Icon size={12} strokeWidth={2.4} />
      </span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dispatch(dismissToast(toast.id))}
        style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', padding: 0, flex: 'none' }}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
