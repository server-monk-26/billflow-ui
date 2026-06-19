import { describe, expect, it } from 'vitest';
import {
  orgReducer,
  orgLoaded,
  setActiveLegalEntity,
  clearOrg,
  type OrgLoadedPayload,
} from './orgSlice';

const payload: OrgLoadedPayload = {
  business: { id: 'b1', name: 'Acme', status: 'ACTIVE' },
  employee: { id: 'e1', firstName: 'Jane', lastName: 'Doe', email: 'j@a.com', mobile: '9', status: 'ACTIVE' },
  legalEntities: [
    { id: 'le1', legalName: 'Acme One' },
    { id: 'le2', legalName: 'Acme Two (primary)', isPrimary: true },
  ],
  storageUnits: [
    { id: 'su1', name: 'WH One', isDefault: true },
    { id: 'su2', name: 'WH Two' },
  ],
};

describe('orgSlice', () => {
  it('defaults the active legal entity to the primary and storage unit to the default', () => {
    const state = orgReducer(undefined, orgLoaded(payload));
    expect(state.activeLegalEntityId).toBe('le2');
    expect(state.activeStorageUnitId).toBe('su1');
    expect(state.business?.name).toBe('Acme');
  });

  it('updates the active legal entity', () => {
    let state = orgReducer(undefined, orgLoaded(payload));
    state = orgReducer(state, setActiveLegalEntity('le1'));
    expect(state.activeLegalEntityId).toBe('le1');
  });

  it('resets on clearOrg', () => {
    const loaded = orgReducer(undefined, orgLoaded(payload));
    const cleared = orgReducer(loaded, clearOrg());
    expect(cleared.business).toBeNull();
    expect(cleared.legalEntities).toHaveLength(0);
  });
});
