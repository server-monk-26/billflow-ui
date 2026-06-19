import { describe, expect, it, beforeEach } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { tokenStorage } from '@/shared/auth';
import type { RootState } from '@/app/store';
import '../i18n';
import { ResetPassword } from './ResetPassword';

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

const withChangeToken: Partial<RootState> = {
  auth: {
    status: 'unauthenticated',
    loginStatus: 'PASSWORD_CHANGE_REQUIRED',
    accessToken: null,
    refreshToken: null,
    sessionId: null,
    expiresIn: null,
    passwordChangeToken: 'pct_123',
  },
};

function renderReset(preloadedState: Partial<RootState> = withChangeToken) {
  return renderWithProviders(
    <Routes>
      <Route path="/auth/reset-password" element={<><ResetPassword /><LocationProbe /></>} />
      <Route path="/auth/login" element={<LocationProbe />} />
      <Route path="/" element={<LocationProbe />} />
    </Routes>,
    { route: '/auth/reset-password', preloadedState },
  );
}

describe('ResetPassword', () => {
  beforeEach(() => tokenStorage.clear());

  it('redirects to login when there is no change-password token', () => {
    renderReset({});
    expect(screen.getByTestId('path')).toHaveTextContent('/auth/login');
  });

  it('keeps Reset disabled until the password is strong', async () => {
    renderReset();
    const button = screen.getByRole('button', { name: /reset password/i });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByPlaceholderText(/enter a new password/i), 'Abcd123!');
    expect(button).toBeEnabled();
  });

  it('changes the password, establishes the session and navigates onward', async () => {
    const { store } = renderReset();
    await userEvent.type(screen.getByPlaceholderText(/enter a new password/i), 'Abcd123!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/'));
    expect(store.getState().auth.status).toBe('authenticated');
    expect(store.getState().currentUser.loaded).toBe(true);
  });
});
