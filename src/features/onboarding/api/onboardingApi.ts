import { baseApi } from '@/shared/api';
import {
  businessResponseSchema,
  legalEntityResponseSchema,
  storageUnitResponseSchema,
  type BusinessResponse,
  type LegalEntityResponse,
  type StorageUnitResponse,
} from '../model/responses';
import type { BusinessPayload, LegalEntityPayload, StorageUnitPayload } from '../model/onboardingSchema';

/**
 * Onboarding mutations injected into the single baseApi (CLAUDE.md §9). Each step of the wizard
 * calls one of these on advance; responses are Zod-validated. The wizard updates the currentUser
 * store from the responses and re-fetches /me at the end.
 */
export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    updateBusinessDetails: build.mutation<BusinessResponse, BusinessPayload>({
      query: (body) => ({ url: '/v1/business/details', method: 'PUT', data: body }),
      transformResponse: (raw: unknown) => businessResponseSchema.parse(raw),
    }),
    createLegalEntity: build.mutation<LegalEntityResponse, LegalEntityPayload>({
      query: (body) => ({ url: '/v1/legal-entities', method: 'POST', data: body }),
      transformResponse: (raw: unknown) => legalEntityResponseSchema.parse(raw),
    }),
    createStorageUnit: build.mutation<StorageUnitResponse, StorageUnitPayload>({
      query: (body) => ({ url: '/v1/storage-units', method: 'POST', data: body }),
      transformResponse: (raw: unknown) => storageUnitResponseSchema.parse(raw),
    }),
  }),
  overrideExisting: false,
});

export const {
  useUpdateBusinessDetailsMutation,
  useCreateLegalEntityMutation,
  useCreateStorageUnitMutation,
} = onboardingApi;
