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
    loginStatus: 'SUCCESS',
    accessToken: 'at_1',
    refreshToken: 'rt_1',
    sessionId: 'as_1',
    expiresIn: 1800,
    passwordChangeToken: null,
  },
  currentUser: {
    loaded: true,
    user: { id: 'u_1', username: '653410', status: 'ACTIVE' },
    roles: ['ADMIN'],
    permissions: [],
    tenant: { id: 't_1', name: 'Acme Traders' },
    business: { id: 'b_1', name: 'Acme Traders', status: 'PENDING_ONBOARDING', businessType: null, sector: null },
    employee: { id: 'e_1', firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', mobile: '9007091265', status: 'ACTIVE' },
    legalEntities: [],
    storageUnits: [],
    activeLegalEntityId: null,
    activeStorageUnitId: null,
  },
};

function renderWizard() {
  return renderWithProviders(
    <Routes>
      <Route path="/onboarding" element={<><OnboardingWizard /><LocationProbe /></>} />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    { route: '/onboarding', preloadedState },
  );
}

async function select(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole('button', { name: label }));
  const listbox = await screen.findByRole('listbox');
  await user.click(within(listbox).getByRole('option', { name: new RegExp(option) }));
}

describe('OnboardingWizard', () => {
  it('walks all three steps (business → legal entity → storage unit) and lands on the dashboard', async () => {
    const user = userEvent.setup();
    const { store } = renderWizard();

    // Step 1 — business (name read-only)
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
    // Final GET /me refreshed the store to the active business.
    expect(store.getState().currentUser.business?.status).toBe('ACTIVE');
  });
});
