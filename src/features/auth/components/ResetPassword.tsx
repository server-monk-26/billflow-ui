import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button, TextInput } from '@/shared/ui';
import { useAppDispatch } from '@/app/store/hooks';
import { loginSucceeded, tokenStorage } from '@/shared/auth';
import { setActiveTenant } from '@/shared/tenant';
import { AUTH_NS } from '../i18n';
import { makeResetSchema, type ResetFormValues } from '../model/resetSchema';
import { evaluatePassword, type StrengthLevel } from '../model/passwordStrength';
import { createDevSession } from '../devAuth';

/**
 * Reset-password screen, rendered inside the AuthLayout container at /auth/reset-password.
 * Shows a runtime strength meter + per-rule checklist; the Reset button enables only once the
 * password satisfies every rule. Backend integration is deferred — a successful reset
 * establishes a session locally (dev stub) and lands on the dashboard.
 *
 * Reached from the first-time-user login flow with `{ passwordChangeToken, userId? }` in
 * navigation state.
 */
const LEVEL_COLOR: Record<StrengthLevel, string> = {
  weak: 'var(--danger)',
  medium: 'var(--warning)',
  strong: 'var(--success)',
};

export function ResetPassword() {
  const { t } = useTranslation(AUTH_NS);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const state = location.state as { userId?: string } | null;
  const userId = state?.userId ?? '123456';

  const schema = useMemo(() => makeResetSchema(t), [t]);
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { password: '' },
  });

  const password = watch('password');
  const strength = evaluatePassword(password);

  const onSubmit = handleSubmit(() => {
    // Deferred backend: establish a session client-side and go to the dashboard.
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
    void navigate('/', { replace: true });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <Link to="/auth/login" style={backLinkStyle}>
        <ArrowLeft size={14} strokeWidth={1.8} />
        {t('reset.backToLogin')}
      </Link>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
        <h1 style={{ fontSize: 'var(--fs-title)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          {t('reset.title')}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>
          {t('reset.subtitle', { userId: '' })}
          <span className="mono" style={{ color: 'var(--text)' }}>
            {userId}
          </span>
        </p>
      </header>

      <form onSubmit={(e) => void onSubmit(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <Controller
          name="password"
          control={control}
          render={({ field: { ref, ...field } }) => (
            <TextInput
              label={t('reset.newPassword')}
              placeholder={t('reset.newPasswordPlaceholder')}
              type="password"
              autoComplete="new-password"
              required
              inputRef={ref}
              {...field}
            />
          )}
        />

        <StrengthMeter level={strength.level} score={strength.score} hasInput={password.length > 0} label={t(`reset.strength.${strength.level}`)} meterLabel={t('reset.strengthLabel')} />

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          {strength.results.map((rule) => (
            <li
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-2)',
                fontSize: 'var(--fs-label)',
                color: rule.passed ? 'var(--success)' : 'var(--text-3)',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 14,
                  height: 14,
                  flex: 'none',
                  borderRadius: '50%',
                  border: rule.passed ? 'none' : '1px solid var(--border-strong)',
                  background: rule.passed ? 'var(--success)' : 'transparent',
                  color: 'var(--surface)',
                }}
              >
                {rule.passed && <Check size={10} strokeWidth={3} />}
              </span>
              {t(rule.labelKey)}
            </li>
          ))}
        </ul>

        <Button type="submit" fullWidth disabled={!strength.isStrong || isSubmitting}>
          {t('reset.submit')}
        </Button>
      </form>
    </div>
  );
}

function StrengthMeter({
  level,
  score,
  hasInput,
  label,
  meterLabel,
}: {
  level: StrengthLevel;
  score: number;
  hasInput: boolean;
  label: string;
  meterLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-label)' }}>
        <span style={{ color: 'var(--text-3)' }}>{meterLabel}</span>
        {hasInput && <span style={{ color: LEVEL_COLOR[level], fontWeight: 600 }}>{label}</span>}
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(score * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: 4, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            width: `${score * 100}%`,
            background: LEVEL_COLOR[level],
            transition: 'width 150ms ease, background 150ms ease',
          }}
        />
      </div>
    </div>
  );
}

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--sp-1)',
  alignSelf: 'flex-start',
  color: 'var(--text-2)',
  textDecoration: 'none',
  fontSize: 'var(--fs-label)',
  fontWeight: 500,
};
