import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Org-context slice (CLAUDE.md §8, §11) — the organization-scoped part of the /me payload:
 * the business, the signed-in employee, and the available legal entities / storage units, plus
 * the currently-selected legal entity and storage unit (the topbar context switchers, Design
 * Spec §10). Available across the app via selectors. Roles/permissions/user live in the auth
 * slice; the active tenant lives in the tenant slice.
 */
export interface Business {
  id: string;
  name: string;
  status: string;
  businessType?: string | null | undefined;
  sector?: string | null | undefined;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: string;
}

export interface LegalEntity {
  id: string;
  legalName: string;
  gstin?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  isPrimary?: boolean | undefined;
  status?: string | undefined;
}

export interface StorageUnit {
  id: string;
  name: string;
  type?: string | undefined;
  city?: string | null | undefined;
  isDefault?: boolean | undefined;
  status?: string | undefined;
}

export interface OrgState {
  business: Business | null;
  employee: Employee | null;
  legalEntities: LegalEntity[];
  storageUnits: StorageUnit[];
  activeLegalEntityId: string | null;
  activeStorageUnitId: string | null;
}

const initialState: OrgState = {
  business: null,
  employee: null,
  legalEntities: [],
  storageUnits: [],
  activeLegalEntityId: null,
  activeStorageUnitId: null,
};

export interface OrgLoadedPayload {
  business: Business;
  employee: Employee;
  legalEntities: LegalEntity[];
  storageUnits: StorageUnit[];
}

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    orgLoaded(state, action: PayloadAction<OrgLoadedPayload>) {
      const { business, employee, legalEntities, storageUnits } = action.payload;
      state.business = business;
      state.employee = employee;
      state.legalEntities = legalEntities;
      state.storageUnits = storageUnits;
      // Default the active selections to the primary legal entity / default storage unit.
      state.activeLegalEntityId =
        legalEntities.find((e) => e.isPrimary)?.id ?? legalEntities[0]?.id ?? null;
      state.activeStorageUnitId =
        storageUnits.find((u) => u.isDefault)?.id ?? storageUnits[0]?.id ?? null;
    },
    /** Onboarding: update the captured business details (and lifecycle status). */
    setBusinessDetails(
      state,
      action: PayloadAction<{ businessType?: string | null; sector?: string | null; status?: string }>,
    ) {
      if (!state.business) return;
      const { businessType, sector, status } = action.payload;
      if (businessType !== undefined) state.business.businessType = businessType;
      if (sector !== undefined) state.business.sector = sector;
      if (status !== undefined) state.business.status = status;
    },
    /** Onboarding: add a newly-created legal entity (becomes active if none is selected). */
    addLegalEntity(state, action: PayloadAction<LegalEntity>) {
      state.legalEntities.push(action.payload);
      if (!state.activeLegalEntityId) state.activeLegalEntityId = action.payload.id;
    },
    /** Onboarding: add a newly-created storage unit (becomes active if none is selected). */
    addStorageUnit(state, action: PayloadAction<StorageUnit>) {
      state.storageUnits.push(action.payload);
      if (!state.activeStorageUnitId) state.activeStorageUnitId = action.payload.id;
    },
    setActiveLegalEntity(state, action: PayloadAction<string>) {
      state.activeLegalEntityId = action.payload;
    },
    setActiveStorageUnit(state, action: PayloadAction<string>) {
      state.activeStorageUnitId = action.payload;
    },
    clearOrg() {
      return initialState;
    },
  },
});

export const {
  orgLoaded,
  setBusinessDetails,
  addLegalEntity,
  addStorageUnit,
  setActiveLegalEntity,
  setActiveStorageUnit,
  clearOrg,
} = orgSlice.actions;
export const orgReducer = orgSlice.reducer;

export interface WithOrg {
  org: OrgState;
}
export const selectBusiness = (s: WithOrg): Business | null => s.org.business;
export const selectEmployee = (s: WithOrg): Employee | null => s.org.employee;
export const selectLegalEntities = (s: WithOrg): LegalEntity[] => s.org.legalEntities;
export const selectStorageUnits = (s: WithOrg): StorageUnit[] => s.org.storageUnits;
export const selectActiveLegalEntityId = (s: WithOrg): string | null => s.org.activeLegalEntityId;
export const selectActiveStorageUnitId = (s: WithOrg): string | null => s.org.activeStorageUnitId;
