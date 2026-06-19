import { useMemo, useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button, TextInput } from '@/shared/ui';
import { isAppError } from '@/shared/api';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { signupInitiated, clearSignup, selectSignupSessionId } from '@/shared/auth';
import { pushToast } from '@/shared/theme';
import { AUTH_NS } from '../i18n';
import { makeSignUpSchema, type SignUpFormValues } from '../model/signUpSchema';
import {
  useSignupInitiateMutation,
  useVerifyOtpMutation,
  useOnboardMutation,
} from '../api/authApi';

/**
 * Two-step sign-up wizard at /auth/sign-up (CLAUDE.md §13).
 * Step 1 — POST /auth/signup/initiate (captures the sessionId into the signup store).
 * Step 2 — verify email + mobile OTPs independently (POST /auth/verify-otp?channel=EMAIL|SMS);
 *          once both are verified, POST /auth/onboard creates the tenant/business/user and
 *          routes to /auth/login. Buttons disable while their request is in flight (single call).
 */
const OTP_LENGTH = 6;
type Step = 1 | 2;

export function SignUp() {
  const { t } = useTranslation(AUTH_NS);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(selectSignupSessionId);

  const [step, setStep] = useState<Step>(1);
  const [signupInitiate, { isLoading: initiating }] = useSignupInitiateMutation();
  const [verifyOtp] = useVerifyOtpMutation();
  const [onboard, { isLoading: onboarding }] = useOnboardMutation();

  const schema = useMemo(() => makeSignUpSchema(t), [t]);
  const { control, handleSubmit, setError } = useForm<SignUpFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', businessName: '', email: '', mobileNumber: '' },
  });

  // ---- Step 2 OTP state ----
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [verifying, setVerifying] = useState<{ email: boolean; mobile: boolean }>({ email: false, mobile: false });
  const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, OTP_LENGTH);

  const goNext = handleSubmit(async (values) => {
    try {
      const res = await signupInitiate(values).unwrap();
      dispatch(signupInitiated({ sessionId: res.sessionId, email: values.email, mobile: values.mobileNumber }));
      setStep(2);
    } catch (err) {
      if (isAppError(err) && err.details) {
        const fields: (keyof SignUpFormValues)[] = ['firstName', 'lastName', 'businessName', 'email', 'mobileNumber'];
        for (const [field, message] of Object.entries(err.details)) {
          if (fields.includes(field as keyof SignUpFormValues)) {
            setError(field as keyof SignUpFormValues, { message });
          }
        }
      }
    }
  });

  const verify = async (channel: 'EMAIL' | 'SMS') => {
    if (!sessionId) return;
    const otp = channel === 'EMAIL' ? emailOtp : mobileOtp;
    if (otp.length !== OTP_LENGTH) return;
    const key = channel === 'EMAIL' ? 'email' : 'mobile';
    setVerifying((v) => ({ ...v, [key]: true }));
    try {
      const res = await verifyOtp({ channel, sessionId, otp }).unwrap();
      if (res.verified) {
        if (channel === 'EMAIL') setEmailVerified(true);
        else setMobileVerified(true);
      }
    } catch {
      // Error toasted by the interceptor.
    } finally {
      setVerifying((v) => ({ ...v, [key]: false }));
    }
  };

  const bothVerified = emailVerified && mobileVerified;

  const createAccount = async () => {
    if (!bothVerified || !sessionId) return;
    try {
      await onboard({ sessionId }).unwrap();
      dispatch(clearSignup());
      dispatch(pushToast({ variant: 'success', message: t('signUp.createdToast') }));
      void navigate('/auth/login', { replace: true });
    } catch {
      // Error toasted by the interceptor.
    }
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

      <Stepper step={step} labels={[t('signUp.steps.details'), t('signUp.steps.verify')]} />

      {step === 1 ? (
        <>
          <Header title={t('signUp.step1.title')} subtitle={t('signUp.step1.subtitle')} />
          <form onSubmit={(e) => void goNext(e)} noValidate style={formStyle}>
            <Field control={control} name="firstName" label={t('signUp.firstName')} placeholder={t('signUp.firstNamePlaceholder')} autoComplete="given-name" />
            <Field control={control} name="lastName" label={t('signUp.lastName')} placeholder={t('signUp.lastNamePlaceholder')} autoComplete="family-name" />
            <Field control={control} name="businessName" label={t('signUp.businessName')} placeholder={t('signUp.businessNamePlaceholder')} autoComplete="organization" />
            <Field control={control} name="email" label={t('signUp.email')} placeholder={t('signUp.emailPlaceholder')} type="email" autoComplete="email" />
            <Field control={control} name="mobileNumber" label={t('signUp.mobile')} placeholder={t('signUp.mobilePlaceholder')} inputMode="tel" autoComplete="tel" />
            <Button type="submit" fullWidth loading={initiating}>
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
              loading={verifying.email}
              onVerify={() => void verify('EMAIL')}
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
              loading={verifying.mobile}
              onVerify={() => void verify('SMS')}
              verifyLabel={t('signUp.verify')}
              verifiedLabel={t('signUp.verified')}
              otpLength={OTP_LENGTH}
            />
            <Button type="button" fullWidth loading={onboarding} disabled={!bothVerified} onClick={() => void createAccount()}>
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
  loading: boolean;
  onVerify: () => void;
  verifyLabel: string;
  verifiedLabel: string;
  otpLength: number;
}

function OtpRow({ testId, label, placeholder, value, onChange, verified, loading, onVerify, verifyLabel, verifiedLabel, otpLength }: OtpRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-2)' }}>
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
        <Button variant="secondary" onClick={onVerify} loading={loading} disabled={value.length !== otpLength} data-testid={`${testId}-verify`}>
          {verifyLabel}
        </Button>
      )}
    </div>
  );
}

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

const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' };
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
