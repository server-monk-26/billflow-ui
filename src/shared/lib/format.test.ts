import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber } from './format';

describe('format', () => {
  it('formats INR in the Indian grouping system', () => {
    // en-IN groups as 1,24,500 (lakh system), not 124,500.
    const out = formatCurrency(124500, { locale: 'en-IN', currency: 'INR' });
    expect(out).toContain('1,24,500');
    expect(out).toMatch(/₹/);
  });

  it('formats plain numbers by locale', () => {
    expect(formatNumber(1000000, 'en-IN')).toBe('10,00,000');
    expect(formatNumber(1000000, 'en-US')).toBe('1,000,000');
  });
});
