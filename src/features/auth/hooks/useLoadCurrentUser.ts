import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { profileLoaded, selectIsAuthenticated } from '@/shared/auth';
import { setActiveTenant } from '@/shared/tenant';
import { orgLoaded, selectBusiness } from '@/shared/org';
import type { Me } from '../model/meSchema';
import { DEV_ME } from '../devMe';

/**
 * Loads the current user's full profile (GET /me) into the global store once they're on the
 * authenticated home page — populating auth (user + server-driven roles/permissions), the active
 * tenant, and the org context (business, employee, legal entities, storage units).
 *
 * Backend not ready: this uses the validated DEV_ME mock. When the endpoint exists, swap the
 * source for `useGetMeQuery()` and dispatch `applyMe` from its fulfilled data — nothing else changes.
 */
function applyMe(dispatch: ReturnType<typeof useAppDispatch>, me: Me): void {
  dispatch(
    profileLoaded({
      user: {
        id: me.user.id,
        name: `${me.employee.firstName} ${me.employee.lastName}`.trim(),
        email: me.employee.email,
      },
      roles: me.roles,
      permissions: me.permissions,
    }),
  );
  dispatch(setActiveTenant({ id: me.tenant.id, name: me.tenant.name }));
  dispatch(
    orgLoaded({
      business: me.business,
      employee: me.employee,
      legalEntities: me.legalEntities,
      storageUnits: me.storageUnits,
    }),
  );
}

export function useLoadCurrentUser(): void {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const business = useAppSelector(selectBusiness);

  useEffect(() => {
    if (!isAuthenticated || business) return;
    applyMe(dispatch, DEV_ME);
  }, [isAuthenticated, business, dispatch]);
}
