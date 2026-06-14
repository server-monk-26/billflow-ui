import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/permissions';
import { Loader } from '@/shared/ui';
import { AppShell } from '@/app/layouts/AppShell';
import { RouteErrorElement } from '@/app/ErrorBoundary';

/**
 * Route tree (CLAUDE.md §12). Feature route components are lazy-loaded (code-split). The app
 * shell is wrapped in <ProtectedRoute> and an errorElement; the auth shell (/login) is public.
 * 404 and 403 are explicit. Feature routes will be injected here as features land (§20).
 */
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/** Wrap a lazy element in Suspense for routes rendered outside the shell's own Suspense. */
function lazyRoute(node: ReactNode): ReactNode {
  return <Suspense fallback={<Loader variant="page" />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: lazyRoute(<LoginPage />),
    errorElement: <RouteErrorElement />,
  },
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
