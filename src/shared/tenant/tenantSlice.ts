import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Tenant slice (CLAUDE.md §11). Resolution strategy (confirmed): the active tenant comes
 * from the auth claim at login. Every API request carries X-Tenant-Id (set in the axios
 * interceptor). Theme, locale, menus, permissions, and flags can be overridden per tenant.
 *
 * On tenant switch the RTK Query cache must be reset to prevent data bleed — see app/store.
 */

export interface Tenant {
  id: string;
  name: string;
  /** Optional per-tenant overrides, merged on top of the base config when present. */
  accentOverride?: string;
  localeDefault?: string;
  featureFlagOverrides?: Record<string, boolean>;
}

export interface TenantState {
  active: Tenant | null;
  available: Tenant[];
}

const initialState: TenantState = {
  active: null,
  available: [],
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setActiveTenant(state, action: PayloadAction<Tenant>) {
      state.active = action.payload;
    },
    setAvailableTenants(state, action: PayloadAction<Tenant[]>) {
      state.available = action.payload;
    },
    clearTenant() {
      return initialState;
    },
  },
});

export const { setActiveTenant, setAvailableTenants, clearTenant } = tenantSlice.actions;
export const tenantReducer = tenantSlice.reducer;

export interface WithTenant {
  tenant: TenantState;
}
export const selectActiveTenant = (s: WithTenant): Tenant | null => s.tenant.active;
export const selectActiveTenantId = (s: WithTenant): string | null => s.tenant.active?.id ?? null;
export const selectAvailableTenants = (s: WithTenant): Tenant[] => s.tenant.available;
