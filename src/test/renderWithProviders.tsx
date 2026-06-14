import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { makeStore, type AppStore, type RootState } from '@/app/store';
import { ThemeProvider } from '@/shared/theme';
import { FeatureFlagProvider } from '@/shared/feature-flags';
import { i18n } from '@/shared/i18n';

/**
 * Test render helper (CLAUDE.md §18). Wraps a UI under the full provider stack with an
 * isolated store so tests don't bleed state. Returns the store for assertions/dispatch.
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = makeStore(preloadedState),
    route = '/',
    ...renderOptions
  }: ExtendedRenderOptions = {},
): RenderResult & { store: AppStore } {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <FeatureFlagProvider>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </FeatureFlagProvider>
          </ThemeProvider>
        </I18nextProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
