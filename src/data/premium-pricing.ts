/**
 * Premium tier pricing per marketplace.
 *
 * Until 2026-05 prices were hardcoded in GEL on the premium page itself.
 * That meant `/us/pro/premium` shipped `29 ₾` to an American pro - both
 * the wrong currency and a value that doesn't map to US market norms.
 *
 * This table holds rough placeholder prices per market, calibrated to
 * approximate purchasing-power parity rather than literal FX conversion.
 * They're meant to feel like reasonable local prices (10-40 USD / month
 * for tiers, marketable round numbers); business should review and
 * adjust before the marketplaces actually launch ads.
 *
 * To add a new market: add a `CountryCode` entry to SUPPORTED_COUNTRIES
 * in `data/countries.ts`, then add its prices here. TypeScript will flag
 * the missing entry on next build.
 */

import type { CountryCode } from '@/data/countries';

export type PremiumTierId = 'basic' | 'pro' | 'elite';
export type BillingPeriod = 'monthly' | 'yearly';

export interface TierPrice {
  monthly: number;
  yearly: number;
}

export const PREMIUM_PRICES_BY_COUNTRY: Record<
  CountryCode,
  Record<PremiumTierId, TierPrice>
> = {
  GE: {
    basic: { monthly: 29, yearly: 290 },
    pro: { monthly: 59, yearly: 590 },
    elite: { monthly: 99, yearly: 990 },
  },
  IL: {
    // Israel - shekel pricing. ~₪40/90/150 monthly bracket.
    basic: { monthly: 39, yearly: 390 },
    pro: { monthly: 89, yearly: 890 },
    elite: { monthly: 149, yearly: 1490 },
  },
  FR: {
    // EU - euro pricing for France.
    basic: { monthly: 10, yearly: 99 },
    pro: { monthly: 20, yearly: 199 },
    elite: { monthly: 35, yearly: 349 },
  },
  US: {
    // USA - USD pricing.
    basic: { monthly: 10, yearly: 99 },
    pro: { monthly: 20, yearly: 199 },
    elite: { monthly: 40, yearly: 399 },
  },
  DE: {
    // EU - matches FR euro pricing.
    basic: { monthly: 10, yearly: 99 },
    pro: { monthly: 20, yearly: 199 },
    elite: { monthly: 35, yearly: 349 },
  },
  UK: {
    // UK - GBP pricing.
    basic: { monthly: 9, yearly: 89 },
    pro: { monthly: 18, yearly: 179 },
    elite: { monthly: 30, yearly: 299 },
  },
};

/**
 * Look up a single price for a marketplace + tier + billing period.
 * Falls back to GE pricing for unknown country codes so the page
 * always has *something* to render instead of NaN / undefined.
 */
export function getPremiumPrice(
  country: CountryCode | string,
  tier: PremiumTierId,
  period: BillingPeriod,
): number {
  const table = PREMIUM_PRICES_BY_COUNTRY[country as CountryCode] ?? PREMIUM_PRICES_BY_COUNTRY.GE;
  return table[tier]?.[period] ?? 0;
}

export function getPremiumTierPrices(
  country: CountryCode | string,
  tier: PremiumTierId,
): TierPrice {
  const table = PREMIUM_PRICES_BY_COUNTRY[country as CountryCode] ?? PREMIUM_PRICES_BY_COUNTRY.GE;
  return table[tier];
}
