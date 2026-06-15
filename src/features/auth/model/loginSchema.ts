import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Login form schema (CLAUDE.md §13 — Zod is the single source of truth for types + validation).
 * `makeLoginSchema(t)` localizes the messages (§16.6); the plain schema gives the static type.
 */
export const loginFormSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const makeLoginSchema = (t: TFunction): z.ZodType<LoginFormValues> =>
  z.object({
    username: z.string().min(1, t('login.required.username')),
    password: z.string().min(1, t('login.required.password')),
  });

// NOTE: the login *response* schema (SUCCESS vs PASSWORD_CHANGE_REQUIRED) lives with the API
// mutation and is intentionally removed while backend integration is deferred. Re-add it here
// (a discriminated union on `status`) when wiring the real /auth/login endpoint.
