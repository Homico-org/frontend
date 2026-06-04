'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  DEFAULT_COUNTRY,
  SUPPORTED_COUNTRIES,
  type CountryCode,
} from '@/data/countries';
import { countryLink } from '@/utils/countryLink';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Resolve the current marketplace country from the URL segment.
 *
 * Reads `params.country` set by the `[country]` dynamic segment that
 * wraps every marketplace route (`/ge/professionals`, `/il/jobs/[id]`
 * etc.) and uppercases it to match the canonical CountryCode form
 * stored on every backend document.
 *
 * URL convention: lowercase (`/ge/...`). Storage / API convention:
 * uppercase (`country: "GE"`). The hook bridges the two so call sites
 * can pass the value straight into a `?country=` query param without
 * re-normalising.
 *
 * Falls back to DEFAULT_COUNTRY (`"GE"`) when:
 *   - consumer is on a non-country-scoped route (admin, settings,
 *     help, auth) and still imports the hook
 *   - the URL segment isn't a supported marketplace (shouldn't
 *     happen because middleware redirects, but defensive)
 */
export function useCountry(): CountryCode {
  const params = useParams<{ country?: string }>();
  const raw = params?.country;
  if (typeof raw === 'string') {
    const upper = raw.toUpperCase();
    if ((SUPPORTED_COUNTRIES as readonly string[]).includes(upper)) {
      return upper as CountryCode;
    }
  }
  return DEFAULT_COUNTRY;
}

/**
 * Returns a path-builder bound to the active marketplace. Use it for
 * `<Link href={cl("/professionals")}>` and `router.push(cl("/jobs/abc"))`.
 *
 * Without this hook every internal navigation to a country-scoped path
 * would bounce through the edge middleware's 307 redirect - correct
 * but server-roundtrip per click. Wrapping the href in `cl(...)`
 * keeps navigation client-side.
 *
 * Returns the helper memoised on the current country so the resulting
 * function reference is stable as long as the marketplace doesn't
 * change - safe to pass into child props without invalidating memos.
 */
export function useCountryLink(): (path: string) => string {
  const country = useCountry();
  return useCallback((path: string) => countryLink(path, country), [country]);
}

/**
 * Resolve a marketplace country on country-agnostic routes (auth,
 * settings, pro/profile-setup, admin). Order of precedence:
 *
 *   1. `[country]` URL segment - present everywhere the visitor is on
 *      a marketplace-scoped page; covers ~90% of call sites and beats
 *      every other source.
 *   2. `user.country` from the auth context - meaningful for pros and
 *      for clients who have explicitly bound themselves to a market.
 *   3. `homico-marketplace` cookie - the sticky marketplace pick set
 *      by middleware on first IP detection or manual switch.
 *   4. DEFAULT_COUNTRY (`"GE"`).
 *
 * The currency-symbol UI on pages like the pro signup wizard or the
 * client settings form should match the marketplace the user is
 * earning / spending in - not always Tbilisi just because the page
 * sits outside the [country] segment.
 */
export function useMarketplaceCountry(): CountryCode {
  const params = useParams<{ country?: string }>();
  const { user } = useAuth();

  const fromUrl = typeof params?.country === 'string' ? params.country.toUpperCase() : null;
  if (fromUrl && (SUPPORTED_COUNTRIES as readonly string[]).includes(fromUrl)) {
    return fromUrl as CountryCode;
  }

  const fromUser = (user as { country?: string } | null)?.country?.toUpperCase();
  if (fromUser && (SUPPORTED_COUNTRIES as readonly string[]).includes(fromUser)) {
    return fromUser as CountryCode;
  }

  if (typeof document !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find((c) => c.startsWith('homico-marketplace='))
      ?.split('=')[1]
      ?.toUpperCase();
    if (cookie && (SUPPORTED_COUNTRIES as readonly string[]).includes(cookie)) {
      return cookie as CountryCode;
    }
  }

  return DEFAULT_COUNTRY;
}
