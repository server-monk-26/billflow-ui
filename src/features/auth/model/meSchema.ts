import { z } from 'zod';

/**
 * Schema for the GET /me response payload (the `data` of the standard envelope). Validated
 * before it reaches the store (CLAUDE.md §8 §13). This is the complete bootstrap profile:
 * user, server-driven roles/permissions, tenant, business, employee, and the available legal
 * entities + storage units.
 */
export const meUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  status: z.string(),
});

export const meTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const meBusinessSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  name: z.string(),
  businessType: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  status: z.string(),
});

export const meEmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  mobile: z.string(),
  status: z.string(),
});

export const meLegalEntitySchema = z.object({
  id: z.string(),
  legalName: z.string(),
  gstin: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isPrimary: z.boolean().optional(),
  status: z.string().optional(),
});

export const meStorageUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  city: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  status: z.string().optional(),
});

export const meSchema = z.object({
  user: meUserSchema,
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  tenant: meTenantSchema,
  business: meBusinessSchema,
  employee: meEmployeeSchema,
  legalEntities: z.array(meLegalEntitySchema),
  storageUnits: z.array(meStorageUnitSchema),
});

export type Me = z.infer<typeof meSchema>;
