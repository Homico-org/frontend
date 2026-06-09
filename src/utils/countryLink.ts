/**
 * Prepend the country segment to an internal URL when one isn't already
 * present.
 *
 * Used everywhere we'd previously write `<Link href="/professionals">`
 * or `router.push('/jobs/123')`. With the multi-country routing in
 * place (2026-05), every marketplace path needs a `/{country}/` prefix
 * so the URL identifies which marketplace the visitor is browsing.
 *
 * Usage:
 *   <Link href={countryLink('/professionals', country)}>
 *   router.push(countryLink(`/jobs/${id}`, country))
 *
 * The function is idempotent: passing an already-prefixed path is a
 * no-op, so it's safe to sprinkle through legacy code without first
 * auditing whether the path is bare or not.
 *
 * Non-marketplace routes (admin, settings, login, help, etc.) should
 * NOT be passed through this helper - they're global and don't carry
 * a country prefix. Calling `countryLink('/login', 'ge')` would
 * produce `/ge/login` which is wrong.
 */

import { DEFAULT_COUNTRY, SUPPORTED_COUNTRIES, type CountryCode } from '@/data/countries';

export function countryLink(path: string, country: CountryCode | string = DEFAULT_COUNTRY): string {
  // URL convention is lowercase (`/ge/...`) even though the canonical
  // CountryCode is uppercase (`"GE"`). Normalise both ends so callers
  // can pass either form.
  const lowerCountry = String(country).toLowerCase();

  if (!path) return `/${lowerCountry}`;
  // External / non-routable links pass through unchanged.
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }
  // Already country-prefixed: detect by checking the first segment.
  const trimmed = path.replace(/^\/+/, '');
  const firstSeg = trimmed.split('/')[0];
  if (firstSeg && (SUPPORTED_COUNTRIES as readonly string[]).includes(firstSeg.toUpperCase())) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  // Otherwise inject the country code as the leading segment.
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${lowerCountry}${cleanPath}`;
}

/**
 * Routes that should NEVER receive a country prefix. Authentication,
 * legal, admin, and the user's own data live globally regardless of
 * which marketplace they were browsing.
 *
 * Updated 2026-05: marketing pages (/become-pro, /how-it-works,
 * /for-business), tools, and /pro/premium moved under [country] because
 * their content is marketplace-specific (examples, currency, pricing).
 * Only `/pro/profile-setup`, `/pro/analytics`, etc. remain agnostic
 * among the /pro/* family.
 */
const COUNTRY_AGNOSTIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/admin',
  '/settings',
  '/help',
  '/about',
  '/terms',
  '/privacy',
  '/messages',
  '/notifications',
  '/bookings',
  '/my-jobs',
  '/my-proposals',
  '/my-reviews',
  '/my-space',
  '/my-work',
  '/pro/profile-setup',
  '/pro/analytics',
  '/pro/orders',
  '/pro/reviews',
  '/orders',
  '/projects',
  '/api',
  '/invite',
  '/review',
  '/careers',
];

export function isCountryAgnostic(path: string): boolean {
  if (!path) return false;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return COUNTRY_AGNOSTIC_PATHS.some(
    (p) => normalized === p || normalized.startsWith(`${p}/`) || normalized.startsWith(`${p}?`),
  );
}

/**
 * Drop the leading `/{country}/` segment from a pathname so callers can
 * compare against country-agnostic route literals. Returns the input
 * unchanged when no country segment is present. Used by surfaces that
 * highlight an active tab based on `usePathname()` - the raw pathname
 * is `/ge/jobs` but the route table holds `/jobs`, so a direct
 * `startsWith` check would always miss.
 *
 * Matches any 2-letter prefix (same permissive convention as
 * `swapCountryPrefix`) - middleware redirects unsupported codes anyway,
 * so a tighter check would just duplicate that work.
 */
export function stripCountryPrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/i, '');
  return stripped === '' ? '/' : stripped;
}

/**
 * Swap (or inject) the country segment in a pathname. Used by the
 * marketplace selector AND the post-login redirect path - we want to
 * land on the same page (e.g. `/professionals/123`) but under the new
 * country prefix. Accepts any 2-letter prefix because middleware
 * handles unsupported codes via redirect.
 */
export function swapCountryPrefix(pathname: string, newCountry: string): string {
  const lower = newCountry.toLowerCase();
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/i, '');
  if (stripped === pathname) {
    return stripped === '/'
      ? `/${lower}`
      : `/${lower}${stripped.startsWith('/') ? stripped : `/${stripped}`}`;
  }
  return stripped === '' || stripped === '/'
    ? `/${lower}`
    : `/${lower}${stripped}`;
}

/**
 * Write the sticky marketplace cookie that the edge middleware reads
 * to resolve bare paths and the layout reads to seed the phone
 * country. Safe no-op on the server.
 */
export function writeMarketplaceCookie(country: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `homico-marketplace=${country.toUpperCase()}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
