import { useMemo, useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button, TextInput } from '@/shared/ui';
import { useAppDispatch } from '@/app/store/hooks';
import { loginSucceeded, tokenStorage } from '@/shared/auth';
import { setActiveTenant } from '@/shared/tenant';
import { AUTH_NS } from '../i18n';
import { makeSignUpSchema, type SignUpFormValues } from '../model/signUpSchema';
import { createDevSession } from '../devAuth';

/**
 * Two-step sign-up wizard, rendered inside the AuthLayout container at /auth/sign-up.
 *
 * Step 1 — capture primary information (RHF + Zod). On Next, the values would be sent to the
 *          backend to create the account (API integration deferred); for now we just advance.
 * Step 2 — verify a 6-digit email OTP and mobile OTP independently. Both are mandatory and must
 *          differ from each other; the Create-account button enables only once both are verified.
 *          On submit, a session is established locally (dev stub) and we land on the dashboard.
 */
const OTP_LENGTH = 6;
type Step = 1 | 2;

export function SignUp() {
  const { t } = useTranslation(AUTH_NS);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<Step>(1);

  // ---- Step 1: primary information ----
  const schema = useMemo(() => makeSignUpSchema(t), [t]);
  const { control, handleSubmit } = useForm<SignUpFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', mobile: '', company: '' },
  });

  const goNext = handleSubmit((_values) => {
    // The captured values would be POSTed to create the account here (deferred). Advance to OTP.
    setStep(2);
  });

  // ---- Step 2: OTP verification ----
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [otpError, setOtpError] = useState<{ email?: string; mobile?: string }>({});

  const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, OTP_LENGTH);

  const verify = (channel: 'email' | 'mobile') => {
    const value = channel === 'email' ? emailOtp : mobileOtp;
    const other = channel === 'email' ? mobileOtp : emailOtp;
    if (value.length !== OTP_LENGTH) {
      setOtpError((e) => ({ ...e, [channel]: t('signUp.otp.length') }));
      return;
    }
    // Both codes are mandatory and must be different from each other.
    if (other.length > 0 && value === other) {
      setOtpError((e) => ({ ...e, [channel]: t('signUp.otp.different') }));
      return;
    }
    setOtpError((e) => ({ ...e, [channel]: undefined }));
    if (channel === 'email') setEmailVerified(true);
    else setMobileVerified(true);
  };

  const bothVerified = emailVerified && mobileVerified;

  const createAccount = () => {
    if (!bothVerified) return;
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      {step === 1 ? (
        <Link to="/auth/login" style={backLinkStyle}>
          <ArrowLeft size={14} strokeWidth={1.8} />
          {t('signUp.backToLogin')}
        </Link>
      ) : (
        <button type="button" onClick={() => setStep(1)} style={{ ...backLinkStyle, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={14} strokeWidth={1.8} />
          {t('signUp.back')}
        </button>
      )}

      <Stepper
        step={step}
        labels={[t('signUp.steps.details'), t('signUp.steps.verify')]}
      />

      {step === 1 ? (
        <>
          <Header title={t('signUp.step1.title')} subtitle={t('signUp.step1.subtitle')} />
          <form onSubmit={(e) => void goNext(e)} noValidate style={formStyle}>
            <Field control={control} name="fullName" label={t('signUp.fullName')} placeholder={t('signUp.fullNamePlaceholder')} autoComplete="name" />
            <Field control={control} name="email" label={t('signUp.email')} placeholder={t('signUp.emailPlaceholder')} type="email" autoComplete="email" />
            <Field control={control} name="mobile" label={t('signUp.mobile')} placeholder={t('signUp.mobilePlaceholder')} inputMode="tel" autoComplete="tel" />
            <Field control={control} name="company" label={t('signUp.company')} placeholder={t('signUp.companyPlaceholder')} autoComplete="organization" />
            <Button type="submit" fullWidth>
              {t('signUp.next')}
            </Button>
          </form>
        </>
      ) : (
        <>
          <Header title={t('signUp.step2.title')} subtitle={t('signUp.step2.subtitle')} />
          <div style={formStyle}>
            <OtpRow
              testId="email-otp"
              label={t('signUp.emailOtp')}
              placeholder={t('signUp.otpPlaceholder')}
              value={emailOtp}
              onChange={(v) => setEmailOtp(onlyDigits(v))}
              verified={emailVerified}
              {...(otpError.email ? { error: otpError.email } : {})}
              onVerify={() => verify('email')}
              verifyLabel={t('signUp.verify')}
              verifiedLabel={t('signUp.verified')}
              otpLength={OTP_LENGTH}
            />
            <OtpRow
              testId="mobile-otp"
              label={t('signUp.mobileOtp')}
              placeholder={t('signUp.otpPlaceholder')}
              value={mobileOtp}
              onChange={(v) => setMobileOtp(onlyDigits(v))}
              verified={mobileVerified}
              {...(otpError.mobile ? { error: otpError.mobile } : {})}
              onVerify={() => verify('mobile')}
              verifyLabel={t('signUp.verify')}
              verifiedLabel={t('signUp.verified')}
              otpLength={OTP_LENGTH}
            />
            <Button type="button" fullWidth disabled={!bothVerified} onClick={createAccount}>
              {t('signUp.submit')}
            </Button>
          </div>
        </>
      )}

      <p style={{ textAlign: 'center', margin: 0, color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>
        {t('signUp.haveAccount')}{' '}
        <Link to="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
          {t('signUp.login')}
        </Link>
      </p>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
      <h1 style={{ fontSize: 'var(--fs-title)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{title}</h1>
      <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>{subtitle}</p>
    </header>
  );
}

function Stepper({ step, labels }: { step: Step; labels: [string, string] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
      {labels.map((label, i) => {
        const index = (i + 1) as Step;
        const active = step === index;
        const done = step > index;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flex: 1 }}>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 22,
                height: 22,
                flex: 'none',
                borderRadius: '50%',
                fontSize: 11,
                fontWeight: 600,
                background: active || done ? 'var(--accent)' : 'var(--surface-2)',
                color: active || done ? 'var(--accent-contrast)' : 'var(--text-3)',
              }}
            >
              {done ? <Check size={12} strokeWidth={3} /> : index}
            </span>
            <span style={{ fontSize: 'var(--fs-label)', fontWeight: active ? 600 : 500, color: active ? 'var(--text)' : 'var(--text-3)' }}>
              {label}
            </span>
            {i === 0 && <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
          </div>
        );
      })}
    </div>
  );
}

interface OtpRowProps {
  testId: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  verified: boolean;
  error?: string;
  onVerify: () => void;
  verifyLabel: string;
  verifiedLabel: string;
  otpLength: number;
}

function OtpRow({ testId, label, placeholder, value, onChange, verified, error, onVerify, verifyLabel, verifiedLabel, otpLength }: OtpRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: error ? 'center' : 'flex-end', gap: 'var(--sp-2)' }}>
      <div style={{ flex: 1 }}>
        <TextInput
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          maxLength={otpLength}
          disabled={verified}
          data-testid={testId}
          {...(error ? { error } : {})}
        />
      </div>
      {verified ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 'var(--row-h)',
            color: 'var(--success)',
            fontSize: 'var(--fs-label)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <Check size={16} strokeWidth={2.4} />
          {verifiedLabel}
        </span>
      ) : (
        <Button variant="secondary" onClick={onVerify} disabled={value.length !== otpLength} data-testid={`${testId}-verify`}>
          {verifyLabel}
        </Button>
      )}
    </div>
  );
}

// Typed wrapper around Controller + TextInput to keep the step-1 markup readable.
function Field({
  control,
  name,
  label,
  placeholder,
  type,
  inputMode,
  autoComplete,
}: {
  control: Control<SignUpFormValues>;
  name: keyof SignUpFormValues;
  label: string;
  placeholder: string;
  type?: 'text' | 'email';
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  autoComplete?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextInput
          label={label}
          placeholder={placeholder}
          required
          inputRef={ref}
          {...(type ? { type } : {})}
          {...(inputMode ? { inputMode } : {})}
          {...(autoComplete ? { autoComplete } : {})}
          {...field}
          {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
        />
      )}
    />
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sp-4)',
};

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
