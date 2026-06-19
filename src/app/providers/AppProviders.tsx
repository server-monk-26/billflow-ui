import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { store } from '@/app/store';
import { ThemeProvider } from '@/shared/theme';
import { FeatureFlagProvider } from '@/shared/feature-flags';
import { Toaster } from '@/shared/ui';
import { i18n } from '@/shared/i18n';
import { AppSideEffects } from './AppSideEffects';

/**
 * Provider composition root (CLAUDE.md §4 — app/providers). Order matters: store first,
 * then i18n, theme, feature flags, then side-effect wiring.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <FeatureFlagProvider>
            <AppSideEffects>{children}</AppSideEffects>
            <Toaster />
          </FeatureFlagProvider>
        </ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
}
