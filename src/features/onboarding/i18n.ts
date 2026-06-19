import { i18n } from '@/shared/i18n';
import en from './locales/en.json';

/** Registers the onboarding i18n namespace (CLAUDE.md §16.6 — namespaces per feature). */
export const ONBOARDING_NS = 'onboarding';

i18n.addResourceBundle('en', ONBOARDING_NS, en, true, true);
