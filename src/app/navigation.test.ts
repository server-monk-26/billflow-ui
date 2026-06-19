import { describe, expect, it } from 'vitest';
import { NAV, filterNav } from './navigation';

describe('filterNav', () => {
  const hasFrom = (perms: string[]) => (p: string) => perms.includes(p);

  it('always keeps permission-less groups (Dashboard)', () => {
    const result = filterNav(NAV, hasFrom([]));
    expect(result.map((g) => g.id)).toContain('dashboard');
    // Groups whose children all require permissions are dropped when none are held.
    expect(result.map((g) => g.id)).not.toContain('purchase');
  });

  it('shows a group only with the permitted children', () => {
    const result = filterNav(NAV, hasFrom(['PRODUCT.VIEW']));
    const masterData = result.find((g) => g.id === 'master-data');
    expect(masterData).toBeDefined();
    expect(masterData?.children?.map((c) => c.id)).toEqual(['product']);
  });

  it('keeps a single-destination group gated by its own permission', () => {
    expect(filterNav(NAV, hasFrom([])).some((g) => g.id === 'inventory')).toBe(false);
    expect(filterNav(NAV, hasFrom(['INVENTORY.VIEW'])).some((g) => g.id === 'inventory')).toBe(true);
  });

  it('an admin with every permission sees all groups', () => {
    const allPerms = NAV.flatMap((g) => [
      ...(g.permission ? [g.permission] : []),
      ...(g.children?.flatMap((c) => (c.permission ? [c.permission] : [])) ?? []),
    ]);
    const result = filterNav(NAV, hasFrom(allPerms));
    expect(result).toHaveLength(NAV.length);
  });
});
