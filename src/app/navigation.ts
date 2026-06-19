/**
 * Sidebar navigation tree (CLAUDE.md §16.1 — nav rendered from data, filtered by the user's
 * permissions from the store). Each node maps to a permission; a node is shown when the user has
 * it (or it has none). A group is shown when any of its children are visible. Adding/removing
 * access requires no component changes — only this data + the permissions from /me.
 *
 * Note: a few sub-tabs don't have an exact permission in the current set; they're mapped to the
 * closest one and are easy to retarget here.
 */
export interface NavLeaf {
  id: string;
  labelKey: string;
  path: string;
  permission?: string;
}

export interface NavGroup {
  id: string;
  labelKey: string;
  icon: string;
  /** Leaf route when the group itself is a single destination (no children). */
  path?: string;
  permission?: string;
  children?: NavLeaf[];
}

export const NAV: NavGroup[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: 'dashboard', path: '/' },
  {
    id: 'purchase',
    labelKey: 'nav.purchase',
    icon: 'purchase',
    children: [
      { id: 'purchase-order', labelKey: 'nav.purchaseOrder', path: '/purchase/orders', permission: 'DOCUMENT.VIEW' },
    ],
  },
  {
    id: 'sale',
    labelKey: 'nav.sale',
    icon: 'sale',
    children: [
      { id: 'delivery-challan', labelKey: 'nav.deliveryChallan', path: '/sales/delivery-challans', permission: 'DOCUMENT.VIEW' },
    ],
  },
  { id: 'inventory', labelKey: 'nav.inventory', icon: 'inventory', path: '/inventory', permission: 'INVENTORY.VIEW' },
  {
    id: 'master-data',
    labelKey: 'nav.masterData',
    icon: 'masterData',
    children: [
      { id: 'product', labelKey: 'nav.product', path: '/master-data/products', permission: 'PRODUCT.VIEW' },
      { id: 'customer', labelKey: 'nav.customer', path: '/master-data/customers', permission: 'CUSTOMER.VIEW' },
      { id: 'supplier', labelKey: 'nav.supplier', path: '/master-data/suppliers', permission: 'SUPPLIER.VIEW' },
    ],
  },
  {
    id: 'report',
    labelKey: 'nav.report',
    icon: 'report',
    children: [
      { id: 'report-inventory', labelKey: 'nav.reportInventory', path: '/reports/inventory', permission: 'REPORT.INVENTORY' },
      { id: 'report-product', labelKey: 'nav.reportProduct', path: '/reports/product', permission: 'REPORT.SALES' },
      { id: 'report-sales', labelKey: 'nav.reportSales', path: '/reports/sales', permission: 'REPORT.SALES' },
      { id: 'report-purchase', labelKey: 'nav.reportPurchase', path: '/reports/purchase', permission: 'REPORT.PURCHASE' },
    ],
  },
  {
    id: 'admin',
    labelKey: 'nav.admin',
    icon: 'admin',
    children: [
      { id: 'employees', labelKey: 'nav.employeeManagement', path: '/admin/employees', permission: 'EMPLOYEE.VIEW' },
      { id: 'roles', labelKey: 'nav.roles', path: '/admin/roles', permission: 'ROLE.VIEW' },
    ],
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: 'settings',
    children: [
      { id: 'legal-entities', labelKey: 'nav.legalEntities', path: '/settings/legal-entities', permission: 'LEGAL_ENTITY.VIEW' },
      { id: 'storage-units', labelKey: 'nav.storageUnits', path: '/settings/storage-units', permission: 'SETTINGS.VIEW' },
    ],
  },
];

/** Filters the nav tree to what the given permission set allows. */
export function filterNav(navigation: NavGroup[], has: (permission: string) => boolean): NavGroup[] {
  const result: NavGroup[] = [];
  for (const group of navigation) {
    if (group.children && group.children.length > 0) {
      const children = group.children.filter((c) => !c.permission || has(c.permission));
      if (children.length > 0) result.push({ ...group, children });
    } else if (!group.permission || has(group.permission)) {
      result.push(group);
    }
  }
  return result;
}
