import { z } from 'zod';

/**
 * The ONLY place `import.meta.env` is read (CLAUDE.md §3.5, §16.5).
 * Every var is validated at startup; invalid config fails fast with a clear error.
 * Only `VITE_`-prefixed vars reach the client — never put secrets here.
 */

const booleanish = z
  .enum(['true', 'false', '1', '0', ''])
  .transform((v) => v === 'true' || v === '1');

// Treat absent ("") or missing (undefined) as "not set" before validating the URL.
const emptyToUndefined = (v: unknown): unknown =>
  v === '' || v === undefined || v === null ? undefined : v;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('BillFlow'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  VITE_LOG_REMOTE_URL: optionalUrl,

  VITE_AUDIT_ENDPOINT: z.string().min(1).default('/api/audit'),

  VITE_FEATURE_FLAGS_URL: optionalUrl,

  VITE_DEFAULT_LOCALE: z.string().min(2).default('en-IN'),
  VITE_DEFAULT_CURRENCY: z.string().length(3).default('INR'),

  VITE_DEFAULT_TENANT_ID: optionalString,

  VITE_ENABLE_MSW: booleanish.default('false'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    // This runs before the logger is guaranteed available, so a thrown error is correct:
    // we want the app to refuse to boot with bad config (CLAUDE.md §16.5 — fail fast).
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}

export const env: Env = parseEnv();
