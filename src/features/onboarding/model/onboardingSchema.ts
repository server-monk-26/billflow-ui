import type { TFunction } from 'i18next';
import { z } from 'zod';
import { stateName } from '@/shared/lib';

/**
 * Onboarding wizard schema + payload builders (CLAUDE.md §13). One combined form drives a
 * 3-step wizard (business → legal entity → storage unit); fields are prefixed (le / su) to keep
 * the otherwise-clashing address fields distinct. The builders assemble the three API payloads,
 * including the hidden fields (stateCode derived from the selected state; contact email/no from
 * the store; isPrimary/isDefault flags; the storage unit's legalEntities link).
 */
export interface OnboardingValues {
  // Step 1 — business
  businessType: string;
  sector: string;
  // Step 2 — legal entity
  leLegalName: string;
  leEntityType: string;
  lePan: string;
  leGstType: string;
  leGstin: string;
  leAddr1: string;
  leAddr2: string;
  leCity: string;
  leState: string; // GST state code
  // Step 3 — storage unit
  suName: string;
  suType: string;
  suAddr1: string;
  suState: string; // GST state code
  suCity: string;
  suPincode: string;
}

export const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof OnboardingValues>> = [
  ['businessType', 'sector'],
  ['leLegalName', 'leEntityType', 'lePan', 'leGstType', 'leGstin', 'leAddr1', 'leCity', 'leState'],
  ['suName', 'suType', 'suAddr1', 'suState', 'suCity', 'suPincode'],
];

const PAN_RE = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][A-Za-z0-9]Z[A-Za-z0-9]$/;
const PINCODE_RE = /^[0-9]{6}$/;

export const makeOnboardingSchema = (t: TFunction): z.ZodType<OnboardingValues> =>
  z.object({
    businessType: z.string().min(1, t('required.businessType')),
    sector: z.string().min(1, t('required.sector')),

    leLegalName: z.string().trim().min(1, t('required.legalName')),
    leEntityType: z.string().min(1, t('required.entityType')),
    lePan: z.string().trim().regex(PAN_RE, t('invalid.pan')),
    leGstType: z.string().min(1, t('required.gstType')),
    leGstin: z.string().trim().regex(GSTIN_RE, t('invalid.gstin')),
    leAddr1: z.string().trim().min(1, t('required.addressLine1')),
    leAddr2: z.string().trim(),
    leCity: z.string().trim().min(1, t('required.city')),
    leState: z.string().min(1, t('required.state')),

    suName: z.string().trim().min(1, t('required.storageName')),
    suType: z.string().min(1, t('required.storageType')),
    suAddr1: z.string().trim().min(1, t('required.addressLine1')),
    suState: z.string().min(1, t('required.state')),
    suCity: z.string().trim().min(1, t('required.city')),
    suPincode: z.string().trim().regex(PINCODE_RE, t('invalid.pincode')),
  });

export const onboardingDefaults: OnboardingValues = {
  businessType: '',
  sector: '',
  leLegalName: '',
  leEntityType: '',
  lePan: '',
  leGstType: '',
  leGstin: '',
  leAddr1: '',
  leAddr2: '',
  leCity: '',
  leState: '',
  suName: '',
  suType: '',
  suAddr1: '',
  suState: '',
  suCity: '',
  suPincode: '',
};

/** Contact info sourced from the global store (signed-in employee). */
export interface OnboardingContext {
  contactEmail: string;
  contactNo: string;
}

export interface BusinessPayload {
  businessType: string;
  sector: string;
}

export interface LegalEntityPayload {
  legalName: string;
  entityType: string;
  pan: string;
  gstType: string;
  gstin: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateCode: string;
  contactEmail: string;
  contactNo: string;
  isPrimary: true;
}

export interface StorageUnitPayload {
  name: string;
  type: string;
  addressLine1: string;
  state: string;
  city: string;
  pincode: string;
  stateCode: string;
  contactEmail: string;
  contactNo: string;
  isDefault: true;
  legalEntities: string[];
}

export function buildBusinessPayload(v: OnboardingValues): BusinessPayload {
  return { businessType: v.businessType, sector: v.sector };
}

export function buildLegalEntityPayload(v: OnboardingValues, ctx: OnboardingContext): LegalEntityPayload {
  return {
    legalName: v.leLegalName,
    entityType: v.leEntityType,
    pan: v.lePan.toUpperCase(),
    gstType: v.leGstType,
    gstin: v.leGstin.toUpperCase(),
    addressLine1: v.leAddr1,
    addressLine2: v.leAddr2,
    city: v.leCity,
    state: stateName(v.leState),
    stateCode: v.leState,
    contactEmail: ctx.contactEmail,
    contactNo: ctx.contactNo,
    isPrimary: true,
  };
}

export function buildStorageUnitPayload(
  v: OnboardingValues,
  ctx: OnboardingContext,
  legalEntityId: string,
): StorageUnitPayload {
  return {
    name: v.suName,
    type: v.suType,
    addressLine1: v.suAddr1,
    state: stateName(v.suState),
    city: v.suCity,
    pincode: v.suPincode,
    stateCode: v.suState,
    contactEmail: ctx.contactEmail,
    contactNo: ctx.contactNo,
    isDefault: true,
    legalEntities: [legalEntityId],
  };
}
