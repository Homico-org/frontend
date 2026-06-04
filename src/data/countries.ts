/**
 * Marketplace-level country reference data (frontend mirror of
 * `backend/src/common/countries.ts`).
 *
 * Two different "country" concepts exist in this codebase:
 *
 *   1. SUPPORTED_COUNTRIES (this file) - countries that have a live
 *      Homico marketplace. A `[country]` URL segment, a populated city
 *      list, a localized landing page, etc. Today: just "GE".
 *
 *   2. `countries` in contexts/LanguageContext.tsx - countries that
 *      can appear in the phone-number picker. Much larger set, because
 *      a US client living in Tbilisi can still register with a +1
 *      number. Phone country and marketplace country are independent.
 *
 * Keep them separate. Conflating "this is a phone prefix we accept"
 * with "we operate a marketplace here" is the source of every future
 * onboarding bug.
 */

export const SUPPORTED_COUNTRIES = [
  "GE",
  "IL",
  "FR",
  "US",
  "DE",
  "UK",
] as const;
export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number];

export const DEFAULT_COUNTRY: CountryCode = "GE";

export function isSupportedCountry(value: unknown): value is CountryCode {
  return (
    typeof value === "string" &&
    (SUPPORTED_COUNTRIES as readonly string[]).includes(value.toUpperCase())
  );
}

/**
 * ISO 4217 currency code per marketplace. Prices are STORED in their
 * native currency and never auto-converted on write - FX rates change
 * and stored values must remain reproducible. Conversion is a
 * presentation-layer choice at the call site.
 */
export const CURRENCY_BY_COUNTRY: Record<CountryCode, string> = {
  GE: "GEL",
  IL: "ILS",
  FR: "EUR",
  US: "USD",
  DE: "EUR",
  UK: "GBP",
};

/**
 * Currency symbol rendered next to the amount. ASCII-only fallback
 * lets us keep the formatter dependency-free; if a new market needs
 * something more exotic, swap in `Intl.NumberFormat` with the right
 * locale at the call site.
 */
export const CURRENCY_SYMBOL: Record<string, string> = {
  GEL: "₾",
  AMD: "֏",
  AZN: "₼",
  TRY: "₺",
  ILS: "₪",
  USD: "$",
  EUR: "€",
  GBP: "£",
  RUB: "₽",
};

/**
 * Preferred UI locale for a first-time visitor to a marketplace. Only
 * seeds the language picker on the marketplace's first landing - the
 * user can pick any of en/ka/ru at any time. Country and language are
 * orthogonal axes.
 */
export const LOCALE_BY_COUNTRY: Record<CountryCode, "ka" | "en" | "ru"> = {
  GE: "ka",
  IL: "en",
  FR: "en",
  US: "en",
  DE: "en",
  UK: "en",
};

/**
 * Display metadata for the country selector in the header. Keeps
 * label + flag emoji in one place so we can render the same pill
 * everywhere (selector trigger, dropdown items, marketplace landing).
 */
export const COUNTRY_LABELS: Record<
  CountryCode,
  { en: string; ka: string; ru: string; flag: string }
> = {
  GE: { en: "Georgia", ka: "საქართველო", ru: "Грузия", flag: "🇬🇪" },
  IL: { en: "Israel", ka: "ისრაელი", ru: "Израиль", flag: "🇮🇱" },
  FR: { en: "France", ka: "საფრანგეთი", ru: "Франция", flag: "🇫🇷" },
  US: { en: "United States", ka: "აშშ", ru: "США", flag: "🇺🇸" },
  DE: { en: "Germany", ka: "გერმანია", ru: "Германия", flag: "🇩🇪" },
  UK: {
    en: "United Kingdom",
    ka: "გაერთიანებული სამეფო",
    ru: "Великобритания",
    flag: "🇬🇧",
  },
};

/**
 * Resolve the canonical currency string for a marketplace code.
 * Defaults to GEL when given an unknown code so old data stays
 * displayable instead of rendering as `undefined`.
 */
export function currencyForCountry(country: string | null | undefined): string {
  if (!country) return CURRENCY_BY_COUNTRY[DEFAULT_COUNTRY];
  return (
    CURRENCY_BY_COUNTRY[country as CountryCode] ??
    CURRENCY_BY_COUNTRY[DEFAULT_COUNTRY]
  );
}

/**
 * Default map center per marketplace - the city our visitors most often
 * want to find pros in. Used as the initial viewport for AddressPicker,
 * LocationPicker, and any other map surface that opens before the user
 * has set a location. A US visitor on /us shouldn't see the map open
 * over Tbilisi.
 */
export const MAP_CENTER_BY_COUNTRY: Record<CountryCode, { lat: number; lng: number; zoom: number }> = {
  GE: { lat: 41.7151, lng: 44.8271, zoom: 12 }, // Tbilisi
  IL: { lat: 32.0853, lng: 34.7818, zoom: 11 }, // Tel Aviv
  FR: { lat: 48.8566, lng: 2.3522, zoom: 11 },  // Paris
  US: { lat: 40.7128, lng: -74.006, zoom: 10 }, // New York
  DE: { lat: 52.52, lng: 13.405, zoom: 11 },    // Berlin
  UK: { lat: 51.5074, lng: -0.1278, zoom: 11 }, // London
};

export function mapCenterForCountry(country: string | null | undefined) {
  if (!country) return MAP_CENTER_BY_COUNTRY[DEFAULT_COUNTRY];
  return (
    MAP_CENTER_BY_COUNTRY[country.toUpperCase() as CountryCode] ??
    MAP_CENTER_BY_COUNTRY[DEFAULT_COUNTRY]
  );
}
