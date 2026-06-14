import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '@/mocks/server';

// MSW for tests (CLAUDE.md §18).
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  // RTL cleanup + reset any per-test handler overrides so cases don't leak.
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// jsdom doesn't implement matchMedia; the theme system (prefers-color-scheme) needs it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
