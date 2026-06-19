import { baseApi } from '@/shared/api';
import {
  signupInitiateResponseSchema,
  verifyOtpResponseSchema,
  onboardResponseSchema,
  loginResponseSchema,
  type SignupInitiateRequest,
  type SignupInitiateResponse,
  type VerifyOtpRequest,
  type VerifyOtpResponse,
  type OtpChannel,
  type OnboardResponse,
  type LoginRequest,
  type LoginResponse,
  type ChangePasswordRequest,
} from '../model/authResponses';
import { meSchema, type Me } from '../model/meSchema';

/**
 * Auth + current-user endpoints injected into the single baseApi (CLAUDE.md §9 — never a new
 * createApi). Responses are validated with Zod in transformResponse. Token storage, store
 * dispatch, and navigation are handled by the calling components (they branch on the result).
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    signupInitiate: build.mutation<SignupInitiateResponse, SignupInitiateRequest>({
      query: (body) => ({ url: '/v1/auth/signup/initiate', method: 'POST', data: body }),
      transformResponse: (raw: unknown) => signupInitiateResponseSchema.parse(raw),
    }),
    verifyOtp: build.mutation<VerifyOtpResponse, { channel: OtpChannel } & VerifyOtpRequest>({
      query: ({ channel, ...body }) => ({
        url: '/v1/auth/verify-otp',
        method: 'POST',
        params: { channel },
        data: body,
      }),
      transformResponse: (raw: unknown) => verifyOtpResponseSchema.parse(raw),
    }),
    onboard: build.mutation<OnboardResponse, { sessionId: string }>({
      query: (body) => ({ url: '/v1/auth/onboard', method: 'POST', data: body }),
      transformResponse: (raw: unknown) => onboardResponseSchema.parse(raw),
    }),
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/v1/auth/login', method: 'POST', data: body }),
      transformResponse: (raw: unknown) => loginResponseSchema.parse(raw),
    }),
    changePassword: build.mutation<LoginResponse, ChangePasswordRequest>({
      query: (body) => ({ url: '/v1/auth/change-password', method: 'POST', data: body }),
      transformResponse: (raw: unknown) => loginResponseSchema.parse(raw),
    }),
    getMe: build.query<Me, void>({
      query: () => ({ url: '/v1/users/me', method: 'GET' }),
      transformResponse: (raw: unknown) => meSchema.parse(raw),
      providesTags: ['Auth'],
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/v1/auth/logout', method: 'POST' }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useSignupInitiateMutation,
  useVerifyOtpMutation,
  useOnboardMutation,
  useLoginMutation,
  useChangePasswordMutation,
  useLazyGetMeQuery,
  useLogoutMutation,
} = authApi;
