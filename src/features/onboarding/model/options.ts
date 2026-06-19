import type { DropdownOption } from '@/shared/ui';

/**
 * Master-data option sets for the onboarding dropdowns. Stubbed reference data (values mirror
 * the backend enums seen in the /me payload, e.g. PRIVATE_LIMITED, REGULAR, WAREHOUSE); when a
 * master-data API exists these can be replaced with a query without touching the wizard.
 */
export const BUSINESS_TYPES: DropdownOption[] = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'TRADING', label: 'Trading' },
  { value: 'DISTRIBUTION', label: 'Distribution' },
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
  { value: 'PROPRIETORSHIP', label: 'Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PRIVATE_LIMITED', label: 'Private Limited' },
  { value: 'PUBLIC_LIMITED', label: 'Public Limited' },
  { value: 'LLP', label: 'LLP' },
  { value: 'HUF', label: 'HUF' },
  { value: 'TRUST', label: 'Trust' },
  { value: 'SOCIETY', label: 'Society' },
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
  { value: 'COLD_STORAGE', label: 'Cold Storage' },
  { value: 'FACTORY', label: 'Factory' },
  { value: 'OUTLET', label: 'Outlet' },
];
