import { i18n } from '@/shared/i18n';
import en from './locales/en.json';

/**
 * Registers the feature's i18n namespace (CLAUDE.md §16.6 — namespaces per feature).
 * Imported as a side effect from the feature barrel so the bundle loads with the lazy chunk.
 */
export const AUTH_NS = 'auth';

i18n.addResourceBundle('en', AUTH_NS, en, true, true);
