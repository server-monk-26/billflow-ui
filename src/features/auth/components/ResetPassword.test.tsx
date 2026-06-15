import { describe, expect, it, beforeEach } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { tokenStorage } from '@/shared/auth';
import '../i18n';
import { ResetPassword } from './ResetPassword';

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function renderReset() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/auth/reset-password"
        element={
          <>
            <ResetPassword />
            <LocationProbe />
          </>
        }
      />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    { route: '/auth/reset-password' },
  );
}

describe('ResetPassword', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it('keeps Reset disabled until the password is strong', async () => {
    renderReset();
    const button = screen.getByRole('button', { name: /reset password/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText('Enter a new password'), 'weak');
    expect(button).toBeDisabled();

    await userEvent.clear(screen.getByPlaceholderText('Enter a new password'));
    await userEvent.type(screen.getByPlaceholderText('Enter a new password'), 'Abcd123!');
    expect(button).toBeEnabled();
  });

  it('on a strong reset, establishes a session and navigates to the dashboard', async () => {
    const { store } = renderReset();
    await userEvent.type(screen.getByPlaceholderText('Enter a new password'), 'Abcd123!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/'));
    expect(tokenStorage.getAccessToken()).toBeTruthy();
    expect(store.getState().auth.status).toBe('authenticated');
  });

  it('renders the back-to-login link', () => {
    renderReset();
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute(
      'href',
      '/auth/login',
    );
  });
});
