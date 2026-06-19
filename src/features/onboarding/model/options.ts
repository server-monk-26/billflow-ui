import type { DropdownOption } from '@/shared/ui';

/**
 * Master-data option sets for the onboarding dropdowns. Stubbed reference data (values mirror
 * the backend enums seen in the /me payload, e.g. PRIVATE_LIMITED, REGULAR, WAREHOUSE); when a
 * master-data API exists these can be replaced with a query without touching the wizard.
 */
export const BUSINESS_TYPES: DropdownOption[] = [
  { value: 'RETAILER', label: 'Retail' },
  { value: 'MANUFACTURER', label: 'Wholesale' },
  { value: 'WHOLESALER', label: 'Manufacturing' },
  { value: 'DISTRIBUTOR', label: 'Distribution' },
  { value: 'SERVICES', label: 'Services' },
];

export const SECTORS: DropdownOption[] = [
  { value: 'FMCG', label: 'FMCG' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'PHARMA', label: 'Pharmaceuticals' },
  { value: 'TEXTILES', label: 'Textiles' },
  { value: 'AUTOMOTIVE', label: 'Automotive' },
  { value: 'FOOD_BEVERAGE', label: 'Food & Beverage' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'OTHER', label: 'Other' },
];

export const ENTITY_TYPES: DropdownOption[] = [
  { value: 'PARTNERSHIP', label: 'Proprietorship' },
  { value: 'PROPRIETORSHIP', label: 'Partnership' },
  { value: 'LLP', label: 'Private Limited' },
  { value: 'PRIVATE_LIMITED', label: 'Public Limited' },
  { value: 'PUBLIC_LIMITED', label: 'LLP' },
  { value: 'HUF', label: 'HUF' }
];

export const GST_TYPES: DropdownOption[] = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'COMPOSITION', label: 'Composition' },
  { value: 'UNREGISTERED', label: 'Unregistered' },
  { value: 'SEZ', label: 'SEZ' },
  { value: 'EXEMPT', label: 'Exempt' },
];

export const STORAGE_TYPES: DropdownOption[] = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'STORE', label: 'Store' },
  { value: 'GODOWN', label: 'Go Down' }
];
