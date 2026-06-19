import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * `currentUser` global store (CLAUDE.md §8) — the GET /api/v1/users/me payload, available app-wide.
 * Holds identity, server-driven roles/permissions, tenant, business, employee, and the legal
 * entities / storage units the user can access, plus the active legal-entity / storage-unit
 * selections (topbar context switchers, Design Spec §10). Populated after login and refreshed
 * during onboarding. RBAC (usePermissions / <Can>) reads roles + permissions from here.
 */
export interface CurrentUserInfo {
  id: string;
  username: string;
  status: string;
}
export interface CurrentTenant {
  id: string;
  name: string;
}
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

export interface CurrentUserData {
  user: CurrentUserInfo;
  roles: string[];
  permissions: string[];
  tenant: CurrentTenant;
  business: Business;
  employee: Employee;
  legalEntities: LegalEntity[];
  storageUnits: StorageUnit[];
}

export interface CurrentUserState {
  loaded: boolean;
  user: CurrentUserInfo | null;
  roles: string[];
  permissions: string[];
  tenant: CurrentTenant | null;
  business: Business | null;
  employee: Employee | null;
  legalEntities: LegalEntity[];
  storageUnits: StorageUnit[];
  activeLegalEntityId: string | null;
  activeStorageUnitId: string | null;
}

const initialState: CurrentUserState = {
  loaded: false,
  user: null,
  roles: [],
  permissions: [],
  tenant: null,
  business: null,
  employee: null,
  legalEntities: [],
  storageUnits: [],
  activeLegalEntityId: null,
  activeStorageUnitId: null,
};

const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState,
  reducers: {
    /** Replace the whole profile (response of GET /me). */
    currentUserLoaded(state, action: PayloadAction<CurrentUserData>) {
      const { user, roles, permissions, tenant, business, employee, legalEntities, storageUnits } =
        action.payload;
      state.loaded = true;
      state.user = user;
      state.roles = roles;
      state.permissions = permissions;
      state.tenant = tenant;
      state.business = business;
      state.employee = employee;
      state.legalEntities = legalEntities;
      state.storageUnits = storageUnits;
      state.activeLegalEntityId =
        legalEntities.find((e) => e.isPrimary)?.id ?? legalEntities[0]?.id ?? null;
      state.activeStorageUnitId =
        storageUnits.find((u) => u.isDefault)?.id ?? storageUnits[0]?.id ?? null;
    },
    /** Onboarding: merge updated business details. */
    setBusinessDetails(
      state,
      action: PayloadAction<{
        businessType?: string | null | undefined;
        sector?: string | null | undefined;
        status?: string | undefined;
      }>,
    ) {
      if (!state.business) return;
      const { businessType, sector, status } = action.payload;
      if (businessType !== undefined) state.business.businessType = businessType;
      if (sector !== undefined) state.business.sector = sector;
      if (status !== undefined) state.business.status = status;
    },
    /** Onboarding: append a newly-created legal entity (becomes active if none selected). */
    addLegalEntity(state, action: PayloadAction<LegalEntity>) {
      state.legalEntities.push(action.payload);
      if (!state.activeLegalEntityId) state.activeLegalEntityId = action.payload.id;
    },
    /** Onboarding: append a newly-created storage unit (becomes active if none selected). */
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
    clearCurrentUser() {
      return initialState;
    },
  },
});

export const {
  currentUserLoaded,
  setBusinessDetails,
  addLegalEntity,
  addStorageUnit,
  setActiveLegalEntity,
  setActiveStorageUnit,
  clearCurrentUser,
} = currentUserSlice.actions;
export const currentUserReducer = currentUserSlice.reducer;

export interface WithCurrentUser {
  currentUser: CurrentUserState;
}
export const selectCurrentUserLoaded = (s: WithCurrentUser): boolean => s.currentUser.loaded;
export const selectCurrentUser = (s: WithCurrentUser): CurrentUserInfo | null => s.currentUser.user;
export const selectRoles = (s: WithCurrentUser): string[] => s.currentUser.roles;
export const selectPermissions = (s: WithCurrentUser): string[] => s.currentUser.permissions;
export const selectTenant = (s: WithCurrentUser): CurrentTenant | null => s.currentUser.tenant;
export const selectBusiness = (s: WithCurrentUser): Business | null => s.currentUser.business;
export const selectEmployee = (s: WithCurrentUser): Employee | null => s.currentUser.employee;
export const selectLegalEntities = (s: WithCurrentUser): LegalEntity[] => s.currentUser.legalEntities;
export const selectStorageUnits = (s: WithCurrentUser): StorageUnit[] => s.currentUser.storageUnits;
export const selectActiveLegalEntityId = (s: WithCurrentUser): string | null =>
  s.currentUser.activeLegalEntityId;
export const selectActiveStorageUnitId = (s: WithCurrentUser): string | null =>
  s.currentUser.activeStorageUnitId;
