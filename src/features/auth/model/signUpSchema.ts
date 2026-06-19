import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Sign-up step 1 (primary information) schema (CLAUDE.md §13). These are the values sent to the
 * backend to create the account (API integration deferred). Step 2 (OTP verification) is handled
 * with local component state, not this schema.
 */
export interface SignUpFormValues {
  fullName: string;
  email: string;
  mobile: string;
  company: string;
}

export const makeSignUpSchema = (t: TFunction): z.ZodType<SignUpFormValues> =>
  z.object({
    fullName: z.string().trim().min(1, t('signUp.required.fullName')),
    email: z.string().trim().email(t('signUp.invalid.email')),
    mobile: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,15}$/, t('signUp.invalid.mobile')),
    company: z.string().trim().min(1, t('signUp.required.company')),
  });
