import { useMemo, useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button, Dropdown, Loader, TextInput, type DropdownOption } from '@/shared/ui';
import { STATE_OPTIONS, uuid } from '@/shared/lib';
import { logger } from '@/shared/logger';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectIsAuthenticated } from '@/shared/auth';
import {
  selectBusiness,
  selectEmployee,
  setBusinessDetails,
  addLegalEntity,
  addStorageUnit,
} from '@/shared/org';
import { useLoadCurrentUser } from '@/features/auth';
import { ONBOARDING_NS } from '../i18n';
import { BUSINESS_TYPES, SECTORS, ENTITY_TYPES, GST_TYPES, STORAGE_TYPES } from '../model/options';
import {
  STEP_FIELDS,
  makeOnboardingSchema,
  onboardingDefaults,
  buildBusinessPayload,
  buildLegalEntityPayload,
  buildStorageUnitPayload,
  type OnboardingValues,
} from '../model/onboardingSchema';

/**
 * Onboarding wizard at /onboarding (CLAUDE.md §13, Design Spec §10 — form/wizard pattern).
 * Opens after login + /me when the business is PENDING_ONBOARDING. Three steps capture the
 * business details, the primary legal entity, and the default storage unit. Hidden fields
 * (stateCode from the selected state; contact email/no from the store; isPrimary/isDefault;
 * the storage unit's legalEntities link) are assembled by the payload builders. The create/
 * update APIs aren't ready — on finish we update the global store and head to the dashboard.
 */
type Step = 0 | 1 | 2;

export function OnboardingWizard() {
  const { t } = useTranslation(ONBOARDING_NS);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useLoadCurrentUser();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const business = useAppSelector(selectBusiness);
  const employee = useAppSelector(selectEmployee);

  const [step, setStep] = useState<Step>(0);

  const schema = useMemo(() => makeOnboardingSchema(t), [t]);
  const { control, handleSubmit, trigger, formState } = useForm<OnboardingValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: onboardingDefaults,
  });

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  // Wait for /me to populate the store.
  if (!business) return <Loader variant="page" />;
  // Already onboarded — no need for the wizard.
  if (business.status !== 'PENDING_ONBOARDING') return <Navigate to="/" replace />;

  const goNext = async () => {
    const valid = await trigger([...STEP_FIELDS[step]!]);
    if (valid) setStep((s) => (Math.min(s + 1, 2) as Step));
  };

  const finish = handleSubmit((values) => {
    const ctx = { contactEmail: employee?.email ?? '', contactNo: employee?.mobile ?? '' };
    const legalEntityId = uuid();
    const storageUnitId = uuid();

    // APIs not ready — assemble the payloads (API-shaped) and update the store instead.
    const businessPayload = buildBusinessPayload(values);
    const legalEntityPayload = buildLegalEntityPayload(values, ctx);
    const storageUnitPayload = buildStorageUnitPayload(values, ctx, legalEntityId);
    logger.info('Onboarding submitted (stub — APIs pending)', {
      businessPayload,
      legalEntityPayload,
      storageUnitPayload,
    });

    dispatch(setBusinessDetails({ ...businessPayload, status: 'ACTIVE' }));
    dispatch(
      addLegalEntity({
        id: legalEntityId,
        legalName: legalEntityPayload.legalName,
        gstin: legalEntityPayload.gstin,
        city: legalEntityPayload.city,
        state: legalEntityPayload.state,
        isPrimary: true,
        status: 'ACTIVE',
      }),
    );
    dispatch(
      addStorageUnit({
        id: storageUnitId,
        name: storageUnitPayload.name,
        type: storageUnitPayload.type,
        city: storageUnitPayload.city,
        isDefault: true,
        status: 'ACTIVE',
      }),
    );
    void navigate('/', { replace: true });
  });

  const stepMeta = [
    { key: 'business', title: t('business.title'), subtitle: t('business.subtitle') },
    { key: 'legalEntity', title: t('legalEntity.title'), subtitle: t('legalEntity.subtitle') },
    { key: 'storageUnit', title: t('storageUnit.title'), subtitle: t('storageUnit.subtitle') },
  ] as const;

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          <h1 style={{ fontSize: 'var(--fs-title)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            {t('title')}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>
            {t('subtitle', { business: business.name })}
          </p>
        </header>

        <Stepper
          step={step}
          labels={[t('steps.business'), t('steps.legalEntity'), t('steps.storageUnit')]}
        />

        <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 600, margin: 0 }}>{stepMeta[step].title}</h2>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 'var(--fs-label)' }}>{stepMeta[step].subtitle}</p>
        </header>

        <form onSubmit={(e) => void finish(e)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {step === 0 && (
            <>
              {/* Business name exists from signup and cannot be changed. */}
              <ReadOnlyField label={t('businessName')} value={business.name} />
              <SelectField control={control} name="businessType" label={t('businessType')} options={BUSINESS_TYPES} placeholder={t('select')} />
              <SelectField control={control} name="sector" label={t('sector')} options={SECTORS} placeholder={t('select')} />
            </>
          )}

          {step === 1 && (
            <>
              <TextField control={control} name="leLegalName" label={t('legalName')} />
              <SelectField control={control} name="leEntityType" label={t('entityType')} options={ENTITY_TYPES} placeholder={t('select')} />
              <TextField control={control} name="lePan" label={t('pan')} placeholder="ABCDE1234F" />
              <SelectField control={control} name="leGstType" label={t('gstType')} options={GST_TYPES} placeholder={t('select')} />
              <TextField control={control} name="leGstin" label={t('gstin')} placeholder="27ABCDE1234F1Z5" />
              <TextField control={control} name="leAddr1" label={t('addressLine1')} />
              <TextField control={control} name="leAddr2" label={t('addressLine2')} required={false} />
              <Row>
                <TextField control={control} name="leCity" label={t('city')} />
                <SelectField control={control} name="leState" label={t('state')} options={STATE_OPTIONS} placeholder={t('select')} />
              </Row>
            </>
          )}

          {step === 2 && (
            <>
              <TextField control={control} name="suName" label={t('storageName')} />
              <SelectField control={control} name="suType" label={t('storageType')} options={STORAGE_TYPES} placeholder={t('select')} />
              <TextField control={control} name="suAddr1" label={t('addressLine1')} />
              <Row>
                <TextField control={control} name="suCity" label={t('city')} />
                <SelectField control={control} name="suState" label={t('state')} options={STATE_OPTIONS} placeholder={t('select')} />
              </Row>
              <TextField control={control} name="suPincode" label={t('pincode')} placeholder="411001" inputMode="numeric" maxLength={6} />
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
            <Button variant="ghost" onClick={() => setStep((s) => (Math.max(s - 1, 0) as Step))} disabled={step === 0}>
              {t('back')}
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={() => void goNext()}>
                {t('next')}
              </Button>
            ) : (
              <Button type="submit" loading={formState.isSubmitting}>
                {t('finish')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Stepper({ step, labels }: { step: Step; labels: [string, string, string] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
      {labels.map((label, i) => {
        const active = step === i;
        const done = step > i;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flex: i < 2 ? 1 : 'none' }}>
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
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span style={{ fontSize: 'var(--fs-label)', fontWeight: active ? 600 : 500, color: active ? 'var(--text)' : 'var(--text-3)', whiteSpace: 'nowrap' }}>
              {label}
            </span>
            {i < 2 && <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
          </div>
        );
      })}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>{children}</div>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: 'var(--fs-label)', fontWeight: 500, color: 'var(--text-2)', marginBottom: 'var(--sp-1)' }}>
        {label}
      </span>
      <div
        style={{
          height: 'var(--row-h)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--sp-3)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          color: 'var(--text-2)',
          fontSize: 'var(--fs-body)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TextField({
  control,
  name,
  label,
  placeholder,
  required = true,
  inputMode,
  maxLength,
}: {
  control: Control<OnboardingValues>;
  name: keyof OnboardingValues;
  label: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  maxLength?: number;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextInput
          label={label}
          required={required}
          inputRef={ref}
          {...(placeholder ? { placeholder } : {})}
          {...(inputMode ? { inputMode } : {})}
          {...(maxLength ? { maxLength } : {})}
          {...field}
          {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
        />
      )}
    />
  );
}

function SelectField({
  control,
  name,
  label,
  options,
  placeholder,
}: {
  control: Control<OnboardingValues>;
  name: keyof OnboardingValues;
  label: string;
  options: DropdownOption[];
  placeholder: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Dropdown
          label={label}
          required
          fullWidth
          placeholder={placeholder}
          options={options}
          value={field.value || null}
          onChange={field.onChange}
          {...(fieldState.error?.message ? { error: fieldState.error.message } : {})}
        />
      )}
    />
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: 'var(--sp-6)',
  background: 'var(--bg)',
  color: 'var(--text)',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 640,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--sp-5)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  boxShadow: 'var(--shadow-lg)',
  padding: 'var(--sp-8)',
};
