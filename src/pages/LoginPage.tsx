import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { sessionEstablished, selectIsAuthenticated, tokenStorage, type Session } from '@/shared/auth';
import { setActiveTenant } from '@/shared/tenant';
import { Button } from '@/shared/ui';

/**
 * Auth shell placeholder (CLAUDE.md §20 — Phase 3 replaces this with the real login feature:
 * RHF + Zod form, RTK Query login mutation, refresh flow). For now a dev sign-in seeds a mock
 * session so the app shell, RBAC gating, and dynamic menus are demonstrable without a backend.
 */
const DEV_SESSION: Session = {
  user: { id: 'u_001', name: 'Aarav Sharma', email: 'aarav@billflow.test' },
  roles: ['admin'],
  permissions: ['invoice:read', 'invoice:create', 'customer:read'],
  tenantId: 't_acme',
  menus: [],
  featureFlags: { 'billing.newDashboard': true },
  accessToken: 'dev.mock.token',
  sessionId: 'dev-session',
};

export default function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const devSignIn = () => {
    tokenStorage.setAccessToken(DEV_SESSION.accessToken);
    if (DEV_SESSION.sessionId) tokenStorage.setSessionId(DEV_SESSION.sessionId);
    dispatch(sessionEstablished(DEV_SESSION));
    dispatch(setActiveTenant({ id: DEV_SESSION.tenantId, name: 'Acme Corp' }));
    void navigate(from, { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          width: 360,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-6)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-4)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--r-sm)',
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
          >
            B
          </span>
          <strong style={{ fontSize: 'var(--fs-card)' }}>{t('app.name')}</strong>
        </div>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 'var(--fs-label)' }}>
          Sign-in is a dev stub — Phase 3 wires the real RHF + Zod login and refresh flow.
        </p>
        <Button onClick={devSignIn} fullWidth>
          Sign in (dev)
        </Button>
      </div>
    </div>
  );
}
