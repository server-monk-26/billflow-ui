import { z } from 'zod';

/**
 * Zod schemas for the auth endpoint responses (validated in transformResponse, CLAUDE.md §9).
 * The axios layer already unwraps the `{ success, data }` envelope, so these describe `data`.
 */
export const signupInitiateResponseSchema = z.object({
  sessionId: z.string(),
});
export type SignupInitiateResponse = z.infer<typeof signupInitiateResponseSchema>;

export const verifyOtpResponseSchema = z.object({
  verified: z.boolean(),
});
export type VerifyOtpResponse = z.infer<typeof verifyOtpResponseSchema>;

export const onboardResponseSchema = z.object({
  tenantId: z.string(),
  businessId: z.string(),
  employeeId: z.string(),
  userId: z.string(),
  username: z.string(),
  email: z.string().optional(),
});
export type OnboardResponse = z.infer<typeof onboardResponseSchema>;

/** Login / change-password response — discriminated by status (SUCCESS vs PASSWORD_CHANGE_REQUIRED). */
export const loginResponseSchema = z.object({
  status: z.enum(['SUCCESS', 'PASSWORD_CHANGE_REQUIRED']),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  sessionId: z.string().optional(),
  expiresIn: z.number().optional(),
  passwordChangeToken: z.string().optional(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** Request bodies. */
export interface SignupInitiateRequest {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  mobileNumber: string;
}
export interface VerifyOtpRequest {
  sessionId: string;
  otp: string;
}
export type OtpChannel = 'EMAIL' | 'SMS';
export interface LoginRequest {
  username: string;
  password: string;
}
export interface ChangePasswordRequest {
  token: string;
  newPassword: string;
}
