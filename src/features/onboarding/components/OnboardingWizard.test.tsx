import { describe, expect, it } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { RootState } from '@/app/store';
import '../i18n';
import { OnboardingWizard } from './OnboardingWizard';

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

const preloadedState: Partial<RootState> = {
  auth: {
    status: 'authenticated',
    tokens: { accessToken: 'a', refreshToken: 'r', sessionId: 's' },
    userId: 'u1',
    tenantId: 't1',
    roles: ['ADMIN'],
    user: null,
    permissions: [],
    menus: [],
    featureFlags: {},
  },
  org: {
    business: { id: 'b1', name: 'Acme Traders', status: 'PENDING_ONBOARDING', businessType: null, sector: null },
    employee: { id: 'e1', firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', mobile: '9007091265', status: 'ACTIVE' },
    legalEntities: [],
    storageUnits: [],
    activeLegalEntityId: null,
    activeStorageUnitId: null,
  },
};

function renderWizard() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/onboarding"
        element={
          <>
            <OnboardingWizard />
            <LocationProbe />
          </>
        }
      />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    { route: '/onboarding', preloadedState },
  );
}

/** Open a labelled Dropdown and pick an option. */
async function select(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole('button', { name: label }));
  const listbox = await screen.findByRole('listbox');
  await user.click(within(listbox).getByRole('option', { name: new RegExp(option) }));
}

describe('OnboardingWizard', () => {
  it('walks all three steps and completes onboarding into the store', async () => {
    const user = userEvent.setup();
    const { store } = renderWizard();

    // Step 1 — business (name is read-only)
    expect(screen.getByText('Acme Traders')).toBeInTheDocument();
    await select(user, 'Business type', 'Retail');
    await select(user, 'Sector', 'FMCG');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Step 2 — legal entity
    expect(await screen.findByText('Legal business entity')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Legal name' }), 'Acme Traders Pvt Ltd');
    await select(user, 'Legal entity type', 'Private Limited');
    await user.type(screen.getByRole('textbox', { name: 'PAN number' }), 'ABCDE1234F');
    await select(user, 'GST type', 'Regular');
    await user.type(screen.getByRole('textbox', { name: 'GST number' }), '27ABCDE1234F1Z5');
    await user.type(screen.getByRole('textbox', { name: 'Address line 1' }), '12 MG Road');
    await user.type(screen.getByRole('textbox', { name: 'City' }), 'Pune');
    await select(user, 'State', 'Maharashtra');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    // Step 3 — storage unit
    expect(await screen.findByText('Storage unit')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Storage unit name' }), 'Main Warehouse');
    await select(user, 'Storage type', 'Warehouse');
    await user.type(screen.getByRole('textbox', { name: 'Address line 1' }), 'Plot 7 MIDC');
    await user.type(screen.getByRole('textbox', { name: 'City' }), 'Pune');
    await select(user, 'State', 'Maharashtra');
    await user.type(screen.getByRole('textbox', { name: 'Pincode' }), '411018');
    await user.click(screen.getByRole('button', { name: 'Finish setup' }));

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/'));
    const org = store.getState().org;
    expect(org.business?.status).toBe('ACTIVE');
    expect(org.business?.businessType).toBe('RETAIL');
    expect(org.legalEntities).toHaveLength(1);
    expect(org.legalEntities[0]?.isPrimary).toBe(true);
    expect(org.storageUnits).toHaveLength(1);
    expect(org.storageUnits[0]?.isDefault).toBe(true);
  });

  it('blocks advancing past step 1 until required fields are set', async () => {
    const user = userEvent.setup();
    renderWizard();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Select a business type')).toBeInTheDocument();
    expect(screen.queryByText('Legal business entity')).not.toBeInTheDocument();
  });
});
