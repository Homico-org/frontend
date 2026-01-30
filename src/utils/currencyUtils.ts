/**
 * Utility functions for currency formatting
 */

export type Currency = 'GEL' | 'USD' | 'EUR';

const currencySymbols: Record<Currency, string> = {
  GEL: '₾',
  USD: '$',
  EUR: '€',
};

/**
 * Format a number as currency (e.g., "₾1,500")
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: Currency = 'GEL'
): string {
  if (amount === undefined || amount === null) return '';
  const symbol = currencySymbols[currency] || '₾';
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Format a price range (e.g., "₾1,000 - ₾2,000")
 */
export function formatPriceRange(
  min: number | undefined | null,
  max: number | undefined | null,
  currency: Currency = 'GEL'
): string {
  const symbol = currencySymbols[currency] || '₾';

  if (min && max) {
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  }
  if (min) {
    return `${symbol}${min.toLocaleString()}+`;
  }
  if (max) {
    return `Up to ${symbol}${max.toLocaleString()}`;
  }
  return '';
}

/**
 * Format a price per unit (e.g., "₾50/მ²" or "₾50/sqm")
 */
export function formatPricePerUnit(
  amount: number | undefined | null,
  unit: string = 'მ²',
  currency: Currency = 'GEL'
): string {
  if (amount === undefined || amount === null) return '';
  const symbol = currencySymbols[currency] || '₾';
  return `${symbol}${amount.toLocaleString()}/${unit}`;
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
  const symbol = currencySymbols[currency] || '₾';

  switch (budget.budgetType) {
    case 'fixed': {
      // Check budgetAmount first, then fall back to budgetMin (used by job posting form)
      const amount = budget.budgetAmount ?? budget.budgetMin;
      return amount
        ? `${symbol}${amount.toLocaleString()}`
        : null;
    }
    case 'range':
      return budget.budgetMin && budget.budgetMax
        ? `${symbol}${budget.budgetMin.toLocaleString()} - ${symbol}${budget.budgetMax.toLocaleString()}`
        : null;
    case 'per_sqm':
      return budget.pricePerUnit
        ? `${symbol}${budget.pricePerUnit}${t('common.perSqmShort')}`
        : null;
    case 'hourly':
      return budget.pricePerUnit
        ? `${symbol}${budget.pricePerUnit}${t('common.perHourShort')}`
        : null;
    case 'flexible':
      return t('common.negotiable');
    default:
      return null;
  }
}
