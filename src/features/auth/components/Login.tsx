import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, TextInput } from '@/shared/ui';
import { isAppError } from '@/shared/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { sessionStored, selectIsAuthenticated } from '@/shared/auth';
import { AUTH_NS } from '../i18n';
import { makeLoginSchema, type LoginFormValues } from '../model/loginSchema';
import { useLoginMutation } from '../api/authApi';
import { useEstablishSession } from '../hooks/useEstablishSession';

/**
 * Login (CLAUDE.md §13). POST /auth/login → stores the auth response. PASSWORD_CHANGE_REQUIRED
 * routes to reset-password (carrying the change-password token in the auth store); SUCCESS
 * establishes the session (tokens + GET /me) and routes by business status (PENDING_ONBOARDING →
 * /onboarding, else dashboard). Server field errors map back into the form; the button is
 * disabled while the request is in flight (single submit).
 */
export function Login() {
  const { t } = useTranslation(AUTH_NS);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [login, { isLoading }] = useLoginMutation();
  const establishSession = useEstablishSession();
  const [busy, setBusy] = useState(false);

  const schema = useMemo(() => makeLoginSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setBusy(true);
    try {
      const result = await login(values).unwrap();

      if (result.status === 'PASSWORD_CHANGE_REQUIRED') {
        // Hold the change-password token in the auth store; reset-password consumes it.
        dispatch(sessionStored(result));
        void navigate('/auth/reset-password', { replace: true });
        return;
      }

      const me = await establishSession(result);
      if (!me) return; // /me failed → blocked here; error toasted by the interceptor.
      void navigate(me.business.status === 'PENDING_ONBOARDING' ? '/onboarding' : from, {
        replace: true,
      });
    } catch (err) {
      if (isAppError(err) && err.details) {
        for (const [field, message] of Object.entries(err.details)) {
          if (field === 'username' || field === 'password') setError(field, { message });
        }
      }
      // General errors surfaced by the global toast (§9).
    } finally {
      setBusy(false);
    }
  });

  const pending = isLoading || busy;

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

      <form onSubmit={(e) => void onSubmit(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
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

        <Button type="submit" loading={pending} fullWidth>
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
