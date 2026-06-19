import { describe, expect, it } from 'vitest';
import {
  buildLegalEntityPayload,
  buildStorageUnitPayload,
  type OnboardingValues,
} from './onboardingSchema';

const values: OnboardingValues = {
  businessType: 'RETAIL',
  sector: 'FMCG',
  leLegalName: 'Acme Traders Pvt Ltd',
  leEntityType: 'PRIVATE_LIMITED',
  lePan: 'abcde1234f',
  leGstType: 'REGULAR',
  leGstin: '27abcde1234f1z5',
  leAddr1: '12 MG Road',
  leAddr2: 'Near Central Mall',
  leCity: 'Pune',
  leState: '27',
  suName: 'Main Warehouse',
  suType: 'WAREHOUSE',
  suAddr1: 'Plot 7 MIDC',
  suState: '27',
  suCity: 'Pune',
  suPincode: '411018',
};

const ctx = { contactEmail: 'jane@acme.com', contactNo: '9007091265' };

describe('onboarding payload builders', () => {
  it('legal entity: derives stateCode/state, uppercases PAN+GSTIN, injects contact + isPrimary', () => {
    const p = buildLegalEntityPayload(values, ctx);
    expect(p.stateCode).toBe('27');
    expect(p.state).toBe('Maharashtra');
    expect(p.pan).toBe('ABCDE1234F');
    expect(p.gstin).toBe('27ABCDE1234F1Z5');
    expect(p.contactEmail).toBe('jane@acme.com');
    expect(p.contactNo).toBe('9007091265');
    expect(p.isPrimary).toBe(true);
  });

  it('storage unit: derives stateCode/state, injects contact, isDefault, and links the legal entity', () => {
    const p = buildStorageUnitPayload(values, ctx, 'le-123');
    expect(p.stateCode).toBe('27');
    expect(p.state).toBe('Maharashtra');
    expect(p.isDefault).toBe(true);
    expect(p.legalEntities).toEqual(['le-123']);
    expect(p.contactNo).toBe('9007091265');
  });
});
