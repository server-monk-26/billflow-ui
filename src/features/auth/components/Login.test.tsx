import { describe, expect, it, beforeEach } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { tokenStorage } from '@/shared/auth';
import '../i18n';
import { Login } from './Login';

/** Surfaces the current path so we can assert navigation outcomes. */
function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/auth/login"
        element={
          <>
            <Login />
            <LocationProbe />
          </>
        }
      />
      <Route path="/auth/reset-password" element={<LocationProbe />} />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    { route: '/auth/login' },
  );
}

describe('Login', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it('logs in a returning user: stores tokens and navigates to the dashboard', async () => {
    const { store } = renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'aarav');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/'));
    expect(tokenStorage.getAccessToken()).toBeTruthy();
    expect(tokenStorage.getRefreshToken()).toBeTruthy();
    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().auth.tenantId).toBeTruthy();
  });

  it('routes a first-time user to reset password (no tokens stored)', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Enter your username'), 'newuser');
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() =>
      expect(screen.getByTestId('path')).toHaveTextContent('/auth/reset-password'),
    );
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('shows a validation error when fields are empty', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByTestId('path')).toHaveTextContent('/auth/login');
  });
});
