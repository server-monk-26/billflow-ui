import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Validates env at startup (fail fast) before anything else reads config — CLAUDE.md §16.5.
import { config } from '@/config';
// Side-effect import bootstraps the i18n instance.
import '@/shared/i18n';
import { logger } from '@/shared/logger';
import { App } from '@/app/App';

async function enableMocking(): Promise<void> {
  if (!config.dev.enableMsw || config.app.isProduction) return;
  try {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
    logger.info('MSW mocking enabled');
  } catch (error) {
    logger.warn('MSW failed to start (run `npx msw init public` to generate the worker)', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

void enableMocking().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
