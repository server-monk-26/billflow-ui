import { useMemo, useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button, Dropdown, Loader, TextInput, type DropdownOption } from '@/shared/ui';
import { STATE_OPTIONS } from '@/shared/lib';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectIsAuthenticated } from '@/shared/auth';
import {
  selectBusiness,
  selectEmployee,
  selectCurrentUserLoaded,
  setBusinessDetails,
  addLegalEntity,
  addStorageUnit,
  currentUserLoaded,
} from '@/shared/currentUser';
import { useLoadCurrentUser, useLazyGetMeQuery } from '@/features/auth';
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
import {
  useUpdateBusinessDetailsMutation,
  useCreateLegalEntityMutation,
  useCreateStorageUnitMutation,
} from '../api/onboardingApi';

/**
 * Onboarding wizard at /onboarding (CLAUDE.md §13, Design Spec §10). Opens when the business is
 * PENDING_ONBOARDING. Each step calls one API on advance:
 *   1. PUT  /business/details   → updates the business (activates it)
 *   2. POST /legal-entities     → creates the primary legal entity (id reused in step 3)
 *   3. POST /storage-units      → creates the default storage unit linked to the legal entity
 * After step 3 we re-fetch GET /me and route by business status (ACTIVE → home). The currentUser
 * store is updated after each step. Step buttons disable while their request is in flight.
 */
type Step = 0 | 1 | 2;

export function OnboardingWizard() {
  const { t } = useTranslation(ONBOARDING_NS);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useLoadCurrentUser();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loaded = useAppSelector(selectCurrentUserLoaded);
  const business = useAppSelector(selectBusiness);
  const employee = useAppSelector(selectEmployee);

  const [step, setStep] = useState<Step>(0);
  const [legalEntityId, setLegalEntityId] = useState<string | null>(null);

  const [updateBusiness, { isLoading: savingBusiness }] = useUpdateBusinessDetailsMutation();
  const [createLegalEntity, { isLoading: savingLegalEntity }] = useCreateLegalEntityMutation();
  const [createStorageUnit, { isLoading: savingStorageUnit }] = useCreateStorageUnitMutation();
  const [triggerMe, { isFetching: refetchingMe }] = useLazyGetMeQuery();

  const schema = useMemo(() => makeOnboardingSchema(t), [t]);
  const { control, getValues, trigger } = useForm<OnboardingValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: onboardingDefaults,
  });

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!loaded || !business) return <Loader variant="page" />;
  if (business.status !== 'PENDING_ONBOARDING') return <Navigate to="/" replace />;

  const ctx = { contactEmail: employee?.email ?? '', contactNo: employee?.mobile ?? '' };

  const submitBusiness = async () => {
    if (!(await trigger([...STEP_FIELDS[0]!]))) return;
    try {
      const res = await updateBusiness(buildBusinessPayload(getValues())).unwrap();
      // Keep status PENDING_ONBOARDING locally so the wizard's "already onboarded" guard
      // doesn't redirect mid-flow; the final GET /me sets the authoritative (ACTIVE) status.
      dispatch(setBusinessDetails({ businessType: res.businessType, sector: res.sector }));
      setStep(1);
    } catch {
      /* toasted by interceptor */
    }
  };

  const submitLegalEntity = async () => {
    if (!(await trigger([...STEP_FIELDS[1]!]))) return;
    try {
      const res = await createLegalEntity(buildLegalEntityPayload(getValues(), ctx)).unwrap();
      setLegalEntityId(res.id);
      dispatch(
        addLegalEntity({
          id: res.id,
          legalName: res.legalName,
          ...(res.gstin ? { gstin: res.gstin } : {}),
          ...(res.city ? { city: res.city } : {}),
          ...(res.state ? { state: res.state } : {}),
          ...(res.isPrimary !== undefined ? { isPrimary: res.isPrimary } : {}),
          ...(res.status ? { status: res.status } : {}),
        }),
      );
      setStep(2);
    } catch {
      /* toasted by interceptor */
    }
  };

  const submitStorageUnit = async () => {
    if (!(await trigger([...STEP_FIELDS[2]!]))) return;
    if (!legalEntityId) return;
    try {
      const res = await createStorageUnit(
        buildStorageUnitPayload(getValues(), ctx, legalEntityId),
      ).unwrap();
      dispatch(
        addStorageUnit({
          id: res.id,
          name: res.name,
          ...(res.type ? { type: res.type } : {}),
          ...(res.city ? { city: res.city } : {}),
          ...(res.isDefault !== undefined ? { isDefault: res.isDefault } : {}),
          ...(res.status ? { status: res.status } : {}),
        }),
      );
      // Refresh the authoritative profile, then route by business status.
      const me = await triggerMe().unwrap();
      dispatch(currentUserLoaded(me));
      void navigate('/', { replace: true });
    } catch {
      /* toasted by interceptor */
    }
  };

  const stepMeta = [
    { title: t('business.title'), subtitle: t('business.subtitle') },
    { title: t('legalEntity.title'), subtitle: t('legalEntity.subtitle') },
    { title: t('storageUnit.title'), subtitle: t('storageUnit.subtitle') },
  ] as const;

  const busy = savingBusiness || savingLegalEntity || savingStorageUnit || refetchingMe;

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

        <Stepper step={step} labels={[t('steps.business'), t('steps.legalEntity'), t('steps.storageUnit')]} />

        <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 600, margin: 0 }}>{stepMeta[step].title}</h2>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 'var(--fs-label)' }}>{stepMeta[step].subtitle}</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {step === 0 && (
            <>
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
            <Button variant="ghost" onClick={() => setStep((s) => (Math.max(s - 1, 0) as Step))} disabled={step === 0 || busy}>
              {t('back')}
            </Button>
            {step === 0 && (
              <Button type="button" loading={savingBusiness} onClick={() => void submitBusiness()}>
                {t('next')}
              </Button>
            )}
            {step === 1 && (
              <Button type="button" loading={savingLegalEntity} onClick={() => void submitLegalEntity()}>
                {t('next')}
              </Button>
            )}
            {step === 2 && (
              <Button type="button" loading={savingStorageUnit || refetchingMe} onClick={() => void submitStorageUnit()}>
                {t('finish')}
              </Button>
            )}
          </div>
        </div>
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
