import { describe, expect, it, beforeEach } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { tokenStorage } from '@/shared/auth';
import '../i18n';
import { Login } from './Login';

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/auth/login" element={<><Login /><LocationProbe /></>} />
      <Route path="/auth/reset-password" element={<LocationProbe />} />
      <Route path="/onboarding" element={<LocationProbe />} />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    { route: '/auth/login' },
  );
}

describe('Login', () => {
  beforeEach(() => tokenStorage.clear());

  it('logs in a returning user: stores the session + currentUser and navigates to the dashboard', async () => {
    const { store } = renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), '653410');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'Password@123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/'));
    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().auth.accessToken).toBeTruthy();
    expect(tokenStorage.getAccessToken()).toBe('at_1');
    expect(store.getState().currentUser.loaded).toBe(true);
    expect(store.getState().currentUser.business?.name).toBe('Acme Traders');
  });

  it('routes a password-change user to reset-password and stores the change token', async () => {
    const { store } = renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'reset');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'Password@123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/auth/reset-password'));
    expect(store.getState().auth.passwordChangeToken).toBe('pct_123');
    expect(store.getState().auth.status).toBe('unauthenticated');
  });
});
