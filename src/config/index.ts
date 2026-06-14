import { env } from './env';

/**
 * The single typed `config` object the rest of the app reads (CLAUDE.md §16.5).
 * Shape it for consumers — feature code should never touch raw env vars.
 */
export const config = {
  app: {
    name: env.VITE_APP_NAME,
    env: env.VITE_APP_ENV,
    isProduction: env.VITE_APP_ENV === 'production',
    isDevelopment: env.VITE_APP_ENV === 'development',
  },
  api: {
    baseUrl: env.VITE_API_BASE_URL,
    timeoutMs: env.VITE_API_TIMEOUT_MS,
  },
  logging: {
    level: env.VITE_LOG_LEVEL,
    remoteUrl: env.VITE_LOG_REMOTE_URL,
  },
  audit: {
    endpoint: env.VITE_AUDIT_ENDPOINT,
  },
  featureFlags: {
    url: env.VITE_FEATURE_FLAGS_URL,
  },
  i18n: {
    defaultLocale: env.VITE_DEFAULT_LOCALE,
    defaultCurrency: env.VITE_DEFAULT_CURRENCY,
  },
  tenant: {
    defaultId: env.VITE_DEFAULT_TENANT_ID,
  },
  dev: {
    enableMsw: env.VITE_ENABLE_MSW,
  },
} as const;

export type AppConfig = typeof config;
