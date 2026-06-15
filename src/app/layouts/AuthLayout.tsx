import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader } from '@/shared/ui';
import './AuthLayout.css';

/**
 * Auth shell, mounted at /auth (CLAUDE.md §12 — layout route for the auth flow). Brand lockup
 * top-left; a centered container hosts the active auth screen (login, register, forgot password)
 * via the Outlet. Built entirely from design tokens.
 */
export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <span className="auth-brand__logo">B</span>
        <span>{t('app.name')}</span>
      </div>

      <div className="auth-container">
        <Suspense fallback={<Loader variant="page" />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
