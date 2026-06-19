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
const SignUp = lazy(() => import('@/features/auth').then((m) => ({ default: m.SignUp })));
const OnboardingWizard = lazy(() =>
  import('@/features/onboarding').then((m) => ({ default: m.OnboardingWizard })),
);
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
      { path: 'sign-up', element: <SignUp /> },
      // Built in a later phase; placeholder keeps the link from 404ing.
      { path: 'forgot-password', element: <PlaceholderPage /> },
    ],
  },
  // Back-compat: redirect the old auth path.
  { path: '/login', element: <Navigate to="/auth/login" replace /> },
  {
    // Focused full-screen wizard (no app shell); auth required.
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        {lazyRoute(<OnboardingWizard />)}
      </ProtectedRoute>
    ),
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
      { path: 'purchase/orders', element: <PlaceholderPage /> },
      { path: 'sales/delivery-challans', element: <PlaceholderPage /> },
      { path: 'inventory', element: <PlaceholderPage /> },
      { path: 'master-data/products', element: <PlaceholderPage /> },
      { path: 'master-data/customers', element: <PlaceholderPage /> },
      { path: 'master-data/suppliers', element: <PlaceholderPage /> },
      { path: 'reports/inventory', element: <PlaceholderPage /> },
      { path: 'reports/product', element: <PlaceholderPage /> },
      { path: 'reports/sales', element: <PlaceholderPage /> },
      { path: 'reports/purchase', element: <PlaceholderPage /> },
      { path: 'admin/employees', element: <PlaceholderPage /> },
      { path: 'admin/roles', element: <PlaceholderPage /> },
      { path: 'settings/legal-entities', element: <PlaceholderPage /> },
      { path: 'settings/storage-units', element: <PlaceholderPage /> },
      { path: '403', element: <Navigate to="/403" replace /> },
    ],
  },
  {
    path: '*',
    element: lazyRoute(<NotFoundPage />),
  },
]);
