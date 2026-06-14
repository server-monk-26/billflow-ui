import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { config } from '@/config';
import commonEn from './locales/en/common.json';

/**
 * i18n bootstrap (CLAUDE.md §16.6). Namespaces are per-feature: features register their own
 * bundles with `i18n.addResourceBundle(lng, '<feature>', resources)` and lazy-load them.
 * The active locale is owned by the ui slice; call `i18n.changeLanguage(locale)` when it changes.
 * No hard-coded user-facing strings anywhere — everything goes through `t()`.
 */
export const SUPPORTED_LOCALES = ['en', 'en-IN', 'hi'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const defaultNS = 'common';

void i18n.use(initReactI18next).init({
  lng: config.i18n.defaultLocale,
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LOCALES],
  nonExplicitSupportedLngs: true,
  defaultNS,
  ns: [defaultNS],
  resources: {
    en: { common: commonEn },
  },
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

export { i18n };
