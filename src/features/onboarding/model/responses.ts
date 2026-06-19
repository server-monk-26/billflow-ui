import { z } from 'zod';

/** Response schemas for the onboarding mutations (validated in transformResponse, §9). */
export const businessResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    businessType: z.string().nullable().optional(),
    sector: z.string().nullable().optional(),
    status: z.string(),
  })
  .passthrough();
export type BusinessResponse = z.infer<typeof businessResponseSchema>;

export const legalEntityResponseSchema = z
  .object({
    id: z.string(),
    legalName: z.string(),
    gstin: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    isPrimary: z.boolean().optional(),
    status: z.string().optional(),
  })
  .passthrough();
export type LegalEntityResponse = z.infer<typeof legalEntityResponseSchema>;

export const storageUnitResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string().optional(),
    city: z.string().nullable().optional(),
    isDefault: z.boolean().optional(),
    status: z.string().optional(),
  })
  .passthrough();
export type StorageUnitResponse = z.infer<typeof storageUnitResponseSchema>;
