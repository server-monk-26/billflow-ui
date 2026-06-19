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
      <Route path="/auth/sign-up" element={<><SignUp /><LocationProbe /></>} />
      <Route path="/auth/login" element={<LocationProbe />} />
    </Routes>,
    { route: '/auth/sign-up' },
  );
}

async function completeStep1() {
  await userEvent.type(screen.getByPlaceholderText('e.g. Jane'), 'Jane');
  await userEvent.type(screen.getByPlaceholderText('e.g. Doe'), 'Doe');
  await userEvent.type(screen.getByPlaceholderText('e.g. Acme Traders'), 'Acme Traders');
  await userEvent.type(screen.getByPlaceholderText('you@company.com'), 'jane@acme.com');
  await userEvent.type(screen.getByPlaceholderText('9876543210'), '9876543210');
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('SignUp', () => {
  beforeEach(() => tokenStorage.clear());

  it('initiates signup and advances to OTP verification, storing the sessionId', async () => {
    const { store } = renderSignUp();
    await completeStep1();
    expect(await screen.findByText('Verify your details')).toBeInTheDocument();
    expect(store.getState().signup.sessionId).toBe('sess_123');
  });

  it('verifies both OTPs then onboards and routes to login', async () => {
    renderSignUp();
    await completeStep1();

    await userEvent.type(screen.getByTestId('email-otp'), '123456');
    await userEvent.click(screen.getByTestId('email-otp-verify'));
    await userEvent.type(screen.getByTestId('mobile-otp'), '987654');
    await userEvent.click(screen.getByTestId('mobile-otp-verify'));

    const createBtn = screen.getByRole('button', { name: 'Create account' });
    await waitFor(() => expect(createBtn).toBeEnabled());
    await userEvent.click(createBtn);

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/auth/login'));
  });
});
