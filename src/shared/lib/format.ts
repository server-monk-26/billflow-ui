/**
 * Locale-aware formatting (CLAUDE.md §16.6, design spec P4 "Numbers are first-class").
 * Currency/number/date are always formatted to locale — default en-IN / ₹ INR.
 * These are pure; pass the active locale from the i18n/ui slice at the call site.
 */

import { config } from '@/config';

export function formatCurrency(
  amount: number,
  options: { locale?: string; currency?: string; maximumFractionDigits?: number } = {},
): string {
  const {
    locale = config.i18n.defaultLocale,
    currency = config.i18n.defaultCurrency,
    maximumFractionDigits = 2,
  } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount);
}

export function formatNumber(value: number, locale: string = config.i18n.defaultLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(
  value: Date | string | number,
  options: { locale?: string } & Intl.DateTimeFormatOptions = {},
): string {
  const { locale = config.i18n.defaultLocale, ...dtf } = options;
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...dtf,
  }).format(date);
}
