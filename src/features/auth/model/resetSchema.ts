import type { TFunction } from 'i18next';
import { z } from 'zod';
import { evaluatePassword } from './passwordStrength';

/**
 * Reset-password form schema (CLAUDE.md §13). A single new-password field that must satisfy
 * every strength rule. The Reset button is gated on the same `isStrong` check; this schema is
 * the belt-and-suspenders validation on submit.
 */
export interface ResetFormValues {
  password: string;
}

export const makeResetSchema = (t: TFunction): z.ZodType<ResetFormValues> =>
  z.object({
    password: z.string().refine((p) => evaluatePassword(p).isStrong, t('reset.notStrong')),
  });
