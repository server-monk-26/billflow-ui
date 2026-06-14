import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { router } from '@/app/router';

/**
 * Composition root component (CLAUDE.md §4). Wraps the router in the provider stack and a
 * top-level error boundary.
 */
export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </ErrorBoundary>
  );
}
