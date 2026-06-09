/**
 * Currency formatting helper.
 *
 * Why this exists: until 2026-05 prices were displayed with a hardcoded
 * `₾` literal scattered across ~120 call sites. When a second
 * marketplace opens that's a sweeping refactor every time. Routing all
 * price display through `formatCurrency` and `currencySymbol` means
 * future markets become a one-line addition in `data/countries.ts`.
 *
 * Today's behaviour for GE callers is byte-identical to the old hand-
 * rolled "${amount}₾" string. The helper takes an optional currency
 * code (or country) to switch symbols when a non-GE price appears.
 */

import {
  CURRENCY_SYMBOL,
  CURRENCY_BY_COUNTRY,
  DEFAULT_COUNTRY,
  currencyForCountry,
  type CountryCode,
} from "@/data/countries";

export type CurrencyInput =
  | { country: CountryCode | string }
  | { currency: string }
  | string
  | undefined;

/**
 * Resolve a currency code from any input form. Accepts:
 *   - a currency code string ("GEL", "USD")
 *   - { country: "GE" }
 *   - { currency: "GEL" }
 *   - undefined  (falls through to the default marketplace's currency)
 */
export function resolveCurrency(input?: CurrencyInput): string {
  if (!input) return CURRENCY_BY_COUNTRY[DEFAULT_COUNTRY];
  if (typeof input === "string") return input;
  if ("currency" in input && input.currency) return input.currency;
  if ("country" in input && input.country) return currencyForCountry(input.country);
  return CURRENCY_BY_COUNTRY[DEFAULT_COUNTRY];
}

/**
 * Best-effort symbol lookup. Falls back to the currency code itself
 * (e.g. "PLN") for currencies we haven't tabulated yet.
 */
export function currencySymbol(input?: CurrencyInput): string {
  const code = resolveCurrency(input);
  return CURRENCY_SYMBOL[code] ?? code;
}

/**
 * Format an amount with its currency symbol. Mimics the legacy
 * `${amount}₾` layout for GEL so visual diff is zero when this helper
 * replaces a hardcoded literal.
 *
 * Options:
 *   - `decimals`: force a decimal count. Default: 0 for round numbers,
 *     2 otherwise.
 *   - `groupSeparator`: thousands separator. Default: space (matches
 *     Georgian and Russian convention; English-locale prices in this
 *     codebase have historically been space-separated too).
 *   - `position`: "after" (default, matches `1000₾`) or "before" (for
 *     currencies like USD where the symbol leads: `$1000`).
 */
export function formatCurrency(
  amount: number | null | undefined,
  input?: CurrencyInput,
  options?: {
    decimals?: number;
    groupSeparator?: string;
    position?: "before" | "after";
  },
): string {
  const symbol = currencySymbol(input);
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;

  const groupSeparator = options?.groupSeparator ?? " ";
  const decimals =
    options?.decimals ??
    (Number.isInteger(value) ? 0 : 2);

  const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  const [intPart, fracPart] = rounded.split(".");
  // Group thousands. Skip the grouping for numbers under 10 000 so we
  // don't introduce a separator where the legacy strings didn't have
  // one (most prices on Homico are in the 50-9 999 ₾ range).
  const grouped =
    value >= 10000
      ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
      : intPart;

  const number = fracPart ? `${grouped}.${fracPart}` : grouped;
  const position = options?.position ?? leadingSymbolFor(symbol);

  return position === "before" ? `${symbol}${number}` : `${number}${symbol}`;
}

/**
 * Format a price range. Returns either a single value (when min === max
 * or one is missing) or `min-max` with one symbol on the right.
 */
export function formatCurrencyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  input?: CurrencyInput,
): string {
  const hasMin = typeof min === "number" && Number.isFinite(min) && min > 0;
  const hasMax = typeof max === "number" && Number.isFinite(max) && max > 0;
  const symbol = currencySymbol(input);

  if (!hasMin && !hasMax) return `0${symbol}`;
  if (hasMin && !hasMax) return formatCurrency(min!, input);
  if (!hasMin && hasMax) return formatCurrency(max!, input);
  if (min === max) return formatCurrency(min!, input);

  const minStr = Math.round(min!).toString();
  const maxStr = Math.round(max!).toString();
  return `${minStr}-${maxStr}${symbol}`;
}

/**
 * Currencies where the convention is "symbol before number" rather
 * than "number followed by symbol". Heuristic table - extend as needed.
 */
function leadingSymbolFor(symbol: string): "before" | "after" {
  if (symbol === "$" || symbol === "£" || symbol === "€") return "before";
  return "after";
}
