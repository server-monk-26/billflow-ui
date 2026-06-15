import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/permissions';
import { Loader } from '@/shared/ui';
import { AppShell } from '@/app/layouts/AppShell';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { RouteErrorElement } from '@/app/ErrorBoundary';

/**
 * Route tree (CLAUDE.md §12). Feature route components are lazy-loaded (code-split) via their
 * public barrel (§3.7). The app shell is wrapped in <ProtectedRoute> + an errorElement; the
 * auth shell (/auth) is public. 404/403 are explicit.
 */
const Login = lazy(() => import('@/features/auth').then((m) => ({ default: m.Login })));
const ResetPassword = lazy(() => import('@/features/auth').then((m) => ({ default: m.ResetPassword })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/** Wrap a lazy element in Suspense for routes rendered outside a layout's own Suspense. */
function lazyRoute(node: ReactNode): ReactNode {
  return <Suspense fallback={<Loader variant="page" />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', element: <Login /> },
      // Receives the passwordChangeToken via navigation state (first-time user flow).
      { path: 'reset-password', element: <ResetPassword /> },
      // Built in a later phase; placeholders keep the links from 404ing.
      { path: 'register', element: <PlaceholderPage /> },
      { path: 'forgot-password', element: <PlaceholderPage /> },
    ],
  },
  // Back-compat: redirect the old auth path.
  { path: '/login', element: <Navigate to="/auth/login" replace /> },
  {
    path: '/403',
    element: lazyRoute(<ForbiddenPage />),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'invoices', element: <PlaceholderPage /> },
      { path: 'customers', element: <PlaceholderPage /> },
      { path: 'settings', element: <PlaceholderPage /> },
      { path: '403', element: <Navigate to="/403" replace /> },
    ],
  },
  {
    path: '*',
    element: lazyRoute(<NotFoundPage />),
  },
]);
