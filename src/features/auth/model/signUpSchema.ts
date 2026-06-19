import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Sign-up step 1 (primary information) schema (CLAUDE.md §13). These are the values sent to
 * POST /auth/signup/initiate. Step 2 (OTP verification) is handled with local component state.
 */
export interface SignUpFormValues {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  mobileNumber: string;
}

export const makeSignUpSchema = (t: TFunction): z.ZodType<SignUpFormValues> =>
  z.object({
    firstName: z.string().trim().min(1, t('signUp.required.firstName')),
    lastName: z.string().trim().min(1, t('signUp.required.lastName')),
    businessName: z.string().trim().min(1, t('signUp.required.businessName')),
    email: z.string().trim().email(t('signUp.invalid.email')),
    mobileNumber: z
      .string()
      .trim()
      .regex(/^[0-9]{10,15}$/, t('signUp.invalid.mobile')),
  });
