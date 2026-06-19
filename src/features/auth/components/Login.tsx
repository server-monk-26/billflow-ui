import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, TextInput } from '@/shared/ui';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { loginSucceeded, selectIsAuthenticated, tokenStorage } from '@/shared/auth';
import { setActiveTenant } from '@/shared/tenant';
import { AUTH_NS } from '../i18n';
import { makeLoginSchema, type LoginFormValues } from '../model/loginSchema';
import { createDevSession } from '../devAuth';

/**
 * Login screen (CLAUDE.md §13 — RHF + Zod). Rendered inside the centered AuthLayout container
 * at /auth/login.
 *
 * NOTE: backend integration is deferred — submitting establishes a session locally via the dev
 * stub (no HTTP). The two UX flows are preserved for development: any login signs in and goes to
 * the dashboard, while username "newuser" simulates a first-time user routed to reset password.
 * Swap `createDevSession` for the real login mutation when wiring the backend.
 */
export function Login() {
  const { t } = useTranslation(AUTH_NS);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const schema = useMemo(() => makeLoginSchema(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit((values) => {
    // First-time user (simulated): route to reset password before a session is issued.
    if (values.username === 'newuser') {
      void navigate('/auth/reset-password', {
        state: { passwordChangeToken: 'dev-password-change-token' },
      });
      return;
    }

    // Returning user (simulated): establish a session client-side.
    const session = createDevSession();
    tokenStorage.setAccessToken(session.accessToken);
    tokenStorage.setRefreshToken(session.refreshToken);
    tokenStorage.setSessionId(session.sessionId);

    dispatch(
      loginSucceeded({
        tokens: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          sessionId: session.sessionId,
        },
        userId: session.userId,
        tenantId: session.tenantId,
        roles: session.roles,
      }),
    );
    dispatch(setActiveTenant({ id: session.tenantId, name: session.tenantId }));

    void navigate(from, { replace: true });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
        <h1 style={{ fontSize: 'var(--fs-title)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          {t('login.title')}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>
          {t('login.subtitle')}
        </p>
      </header>

      <form
        onSubmit={(e) => void onSubmit(e)}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
      >
        <Controller
          name="username"
          control={control}
          render={({ field: { ref, ...field } }) => (
            <TextInput
              label={t('login.username')}
              placeholder={t('login.usernamePlaceholder')}
              autoComplete="username"
              required
              inputRef={ref}
              {...field}
              {...(errors.username?.message ? { error: errors.username.message } : {})}
            />
          )}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          <Controller
            name="password"
            control={control}
            render={({ field: { ref, ...field } }) => (
              <TextInput
                label={t('login.password')}
                placeholder={t('login.passwordPlaceholder')}
                type="password"
                autoComplete="current-password"
                required
                inputRef={ref}
                {...field}
                {...(errors.password?.message ? { error: errors.password.message } : {})}
              />
            )}
          />
          <Link to="/auth/forgot-password" style={linkStyle}>
            {t('login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth>
          {t('login.submit')}
        </Button>
      </form>

      <p style={{ textAlign: 'center', margin: 0, color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>
        {t('login.noAccount')}{' '}
        <Link to="/auth/sign-up" style={linkStyle}>
          {t('login.register')}
        </Link>
      </p>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  color: 'var(--accent)',
  textDecoration: 'none',
  fontSize: 'var(--fs-label)',
  fontWeight: 500,
};
