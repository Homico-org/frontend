/**
 * Utility functions for currency formatting.
 *
 * This file predates the multi-country foundation (2026-05). The
 * canonical symbol table now lives in `data/countries.ts` and the
 * canonical formatter in `utils/currency.ts`. The helpers below remain
 * for backward compatibility with the ~30 call sites already wired to
 * them - they delegate to the new module so the symbol set is shared.
 *
 * For new code prefer `formatCurrency` / `formatCurrencyRange` from
 * `utils/currency.ts` which accept a country code directly.
 */

import { CURRENCY_SYMBOL } from '@/data/countries';

// Currency codes that the marketplace currently supports. Extending
// this list is mechanical: drop the new ISO 4217 code into the union
// and into `data/countries.ts:CURRENCY_SYMBOL`.
export type Currency = 'GEL' | 'USD' | 'EUR' | 'ILS' | 'GBP';

const currencySymbols: Record<Currency, string> = {
  GEL: CURRENCY_SYMBOL.GEL,
  USD: CURRENCY_SYMBOL.USD,
  EUR: CURRENCY_SYMBOL.EUR,
  ILS: CURRENCY_SYMBOL.ILS,
  GBP: CURRENCY_SYMBOL.GBP,
};

/**
 * Which side the symbol sits on. ₾/₪ trail the number in Georgian/Hebrew
 * convention; $/€/£ lead by Anglophone/European convention. Previously
 * every helper here hardcoded `${symbol}${amount}` so Georgian users
 * saw "₾1,500" instead of the native "1,500₾".
 */
const SYMBOL_POSITION: Record<Currency, 'before' | 'after'> = {
  GEL: 'after',
  ILS: 'after',
  USD: 'before',
  EUR: 'before',
  GBP: 'before',
};

function wrap(amount: number, currency: Currency, suffix = ''): string {
  const symbol = currencySymbols[currency] || '₾';
  const num = amount.toLocaleString();
  return SYMBOL_POSITION[currency] === 'before'
    ? `${symbol}${num}${suffix}`
    : `${num}${symbol}${suffix}`;
}

/**
 * Format a number as currency (e.g., "1,500₾" or "$1,500").
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: Currency = 'GEL'
): string {
  if (amount === undefined || amount === null) return '';
  return wrap(amount, currency);
}

/**
 * Format a price range (e.g., "1,000-2,000₾" or "$1,000-$2,000").
 */
export function formatPriceRange(
  min: number | undefined | null,
  max: number | undefined | null,
  currency: Currency = 'GEL'
): string {
  if (min && max) {
    if (SYMBOL_POSITION[currency] === 'after') {
      // Locale convention for trailing-symbol currencies is one trailing
      // symbol, not two: "1,000-2,000₾".
      const symbol = currencySymbols[currency] || '₾';
      return `${min.toLocaleString()}-${max.toLocaleString()}${symbol}`;
    }
    return `${wrap(min, currency)} - ${wrap(max, currency)}`;
  }
  if (min) return `${wrap(min, currency)}+`;
  if (max) return `Up to ${wrap(max, currency)}`;
  return '';
}

/**
 * Format a price per unit (e.g., "50₾/მ²" or "$50/sqm").
 */
export function formatPricePerUnit(
  amount: number | undefined | null,
  unit: string = 'მ²',
  currency: Currency = 'GEL'
): string {
  if (amount === undefined || amount === null) return '';
  return wrap(amount, currency, `/${unit}`);
}

interface BudgetInfo {
  budgetType?: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
}

/**
 * Translation function type for i18n support
 */
type TranslationFn = (key: string) => string;

/**
 * Format a price input with space separators (e.g., "1 500" for display)
 * Used for formatting input values in forms
 */
export function formatPriceInput(value: string): string {
  if (!value) return '';
  return Number(value).toLocaleString('en-US').replace(/,/g, ' ');
}

/**
 * Parse a formatted price back to number string (remove spaces, prevent negative)
 */
export function parsePriceInput(value: string): string {
  // Remove spaces and non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  // Ensure only one decimal point
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
}

/**
 * Format a number with thousand separators using spaces
 */
export function formatNumberWithSpaces(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US').replace(/,/g, ' ');
}

/**
 * Format a job budget based on its type
 * @param budget - Budget information object
 * @param t - Translation function from useLanguage hook
 * @param currency - Currency type (default: GEL)
 */
export function formatBudget(
  budget: BudgetInfo,
  t: TranslationFn,
  currency: Currency = 'GEL'
): string | null {
  switch (budget.budgetType) {
    case 'fixed': {
      // Check budgetAmount first, then fall back to budgetMin (used by job posting form)
      const amount = budget.budgetAmount ?? budget.budgetMin;
      return amount ? formatCurrency(amount, currency) : null;
    }
    case 'range':
      return budget.budgetMin && budget.budgetMax
        ? formatPriceRange(budget.budgetMin, budget.budgetMax, currency)
        : null;
    case 'per_sqm':
      // `t('common.perSqmShort')` already carries the leading `/` (e.g.
      // "/sqm", "/მ²"), so we just concat after the currency-aware
      // amount instead of going through `formatPricePerUnit`'s own slash.
      return budget.pricePerUnit
        ? `${formatCurrency(budget.pricePerUnit, currency)}${t('common.perSqmShort')}`
        : null;
    case 'hourly':
      return budget.pricePerUnit
        ? `${formatCurrency(budget.pricePerUnit, currency)}${t('common.perHourShort')}`
        : null;
    case 'flexible':
      return t('common.negotiable');
    default:
      return null;
  }
}
