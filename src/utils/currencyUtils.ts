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
 * Format a price input with space separators (e.g., "1 500" for display)
 * Used for formatting input values in forms
 */
export function formatPriceInput(value: string): string {
  if (!value) return '';
  return Number(value).toLocaleString('en-US').replace(/,/g, ' ');
}

/**
 * Parse a formatted price back to number string (remove spaces)
 */
export function parsePriceInput(value: string): string {
  return value.replace(/\s/g, '');
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
 */
export function formatBudget(
  budget: BudgetInfo,
  locale: 'en' | 'ka' = 'en',
  currency: Currency = 'GEL'
): string | null {
  const symbol = currencySymbols[currency] || '₾';

  switch (budget.budgetType) {
    case 'fixed':
      return budget.budgetAmount
        ? `${symbol}${budget.budgetAmount.toLocaleString()}`
        : null;
    case 'range':
      return budget.budgetMin && budget.budgetMax
        ? `${symbol}${budget.budgetMin.toLocaleString()} - ${symbol}${budget.budgetMax.toLocaleString()}`
        : null;
    case 'per_sqm':
      return budget.pricePerUnit
        ? `${symbol}${budget.pricePerUnit}/${locale === 'ka' ? 'მ²' : 'sqm'}`
        : null;
    case 'hourly':
      return budget.pricePerUnit
        ? `${symbol}${budget.pricePerUnit}/${locale === 'ka' ? 'სთ' : 'hr'}`
        : null;
    case 'flexible':
      return locale === 'ka' ? 'მოლაპარაკებით' : 'Negotiable';
    default:
      return null;
  }
}
