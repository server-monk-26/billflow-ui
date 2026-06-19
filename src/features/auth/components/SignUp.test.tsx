import { describe, expect, it, beforeEach } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { tokenStorage } from '@/shared/auth';
import '../i18n';
import { SignUp } from './SignUp';

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function renderSignUp() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/auth/sign-up"
        element={
          <>
            <SignUp />
            <LocationProbe />
          </>
        }
      />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    { route: '/auth/sign-up' },
  );
}

async function completeStep1() {
  await userEvent.type(screen.getByPlaceholderText('e.g. Aarav Sharma'), 'Aarav Sharma');
  await userEvent.type(screen.getByPlaceholderText('you@company.com'), 'aarav@acme.com');
  await userEvent.type(screen.getByPlaceholderText('+91 98765 43210'), '9876543210');
  await userEvent.type(screen.getByPlaceholderText('e.g. Acme Corp'), 'Acme Corp');
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('SignUp', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it('advances to verification only after valid primary info', async () => {
    renderSignUp();
    // Invalid: empty submit stays on step 1.
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.queryByText('Verify your details')).not.toBeInTheDocument();

    await completeStep1();
    expect(await screen.findByText('Verify your details')).toBeInTheDocument();
  });

  it('requires both OTPs verified and different before enabling Create account', async () => {
    renderSignUp();
    await completeStep1();

    const [emailOtp, mobileOtp] = screen.getAllByPlaceholderText('6-digit code');
    const createBtn = screen.getByRole('button', { name: 'Create account' });
    expect(createBtn).toBeDisabled();

    // Verify email.
    await userEvent.type(emailOtp!, '123456');
    await userEvent.click(screen.getAllByRole('button', { name: 'Verify' })[0]!);
    expect(await screen.findByText('Verified')).toBeInTheDocument();
    expect(createBtn).toBeDisabled(); // mobile still pending

    // Same code for mobile → rejected (must differ).
    await userEvent.type(mobileOtp!, '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText(/must be different/i)).toBeInTheDocument();
    expect(createBtn).toBeDisabled();

    // Different valid code → verified, button enabled.
    await userEvent.clear(mobileOtp!);
    await userEvent.type(mobileOtp!, '654321');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    await waitFor(() => expect(createBtn).toBeEnabled());
  });

  it('creates the account and navigates to the dashboard', async () => {
    const { store } = renderSignUp();
    await completeStep1();

    const [emailOtp, mobileOtp] = screen.getAllByPlaceholderText('6-digit code');
    await userEvent.type(emailOtp!, '111111');
    await userEvent.click(screen.getAllByRole('button', { name: 'Verify' })[0]!);
    await userEvent.type(mobileOtp!, '222222');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/'));
    expect(store.getState().auth.status).toBe('authenticated');
    expect(tokenStorage.getAccessToken()).toBeTruthy();
  });
});
