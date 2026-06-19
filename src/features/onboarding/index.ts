// Registers the onboarding i18n namespace as a side effect when the barrel is imported.
import './i18n';

export { OnboardingWizard } from './components/OnboardingWizard';
export {
  makeOnboardingSchema,
  buildBusinessPayload,
  buildLegalEntityPayload,
  buildStorageUnitPayload,
  STEP_FIELDS,
} from './model/onboardingSchema';
export type { OnboardingValues } from './model/onboardingSchema';
