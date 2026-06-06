import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from '@/data/countries';

/**
 * Marketplace-route detection.
 *
 * Country prefix only applies to routes that present marketplace
 * supply (pros, jobs) or actions inside a marketplace (post-job). Every
 * other route - auth, admin, the user's own data, legal, help - stays
 * global because it isn't scoped to a single marketplace.
 *
 * Path is checked AFTER stripping the leading `/`.
 */
const COUNTRY_SCOPED_FIRST_SEGMENTS = new Set([
  'professionals',
  'jobs',
  'post-job',
  // Marketing + signup pages added 2026-05. Each renders examples and
  // pricing in the marketplace's currency, so the URL should make the
  // marketplace explicit (better SEO + better signal to non-GE visitors
  // that we operate in their market).
  'become-pro',
  'how-it-works',
  'for-business',
  // Tools (calculator / price database / analyzer / compare) use ₾
  // outputs and Tbilisi market data - the URL should match the
  // marketplace until per-country tool data lands.
  'tools',
  // Root path (`""`) is handled separately - we always send root
  // visitors to a marketplace landing.
]);

/**
 * Second-segment guards for routes where the FIRST segment is shared
 * with country-agnostic siblings. E.g. `/pro/premium` is country-scoped
 * (premium pricing is in marketplace currency) but `/pro/profile-setup`
 * and `/pro/portfolio` are pro-self-management and stay global.
 */
const COUNTRY_SCOPED_NESTED: Record<string, Set<string>> = {
  pro: new Set(['premium']),
};

/**
 * Maximum cookie age for the marketplace pref. 1 year, refreshed on
 * every visit so an active user never falls back to geo-IP detection.
 */
const COUNTRY_COOKIE = 'homico-marketplace';
const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Map an ISO 3166-1 alpha-2 country code from Cloudflare's
 * `cf-ipcountry` header to one of our SUPPORTED_COUNTRIES. Unknown
 * countries (Israel, US, EU diaspora) all fall through to GE because
 * Georgia is currently the only live marketplace. When AM or AZ go
 * live, add them to SUPPORTED_COUNTRIES in data/countries.ts and they
 * become valid detection targets automatically.
 */
function resolveCountryFromGeo(geoHeader: string | null): string {
  if (!geoHeader) return DEFAULT_COUNTRY;
  const upper = geoHeader.toUpperCase();
  if ((SUPPORTED_COUNTRIES as readonly string[]).includes(upper)) {
    return upper;
  }
  return DEFAULT_COUNTRY;
}

/**
 * Resolve the marketplace to redirect this visitor to. Priority order:
 *
 *   1. Sticky preference (`homico-marketplace` cookie) - if they've
 *      already chosen a marketplace, respect it.
 *   2. Cloudflare geo-IP header (`cf-ipcountry`) - geographic guess.
 *   3. DEFAULT_COUNTRY (GE) - fallback when nothing else works.
 */
function resolveMarketplace(req: NextRequest): string {
  const cookieValue = req.cookies.get(COUNTRY_COOKIE)?.value?.toUpperCase();
  if (cookieValue && (SUPPORTED_COUNTRIES as readonly string[]).includes(cookieValue)) {
    return cookieValue;
  }
  return resolveCountryFromGeo(req.headers.get('cf-ipcountry'));
}

/**
 * Heuristic: a "looks like a country code" first segment is two ASCII
 * letters. Used to detect when a visitor types something like
 * `/li/professionals` for a country we don't actually serve - we
 * silently rewrite the prefix to the resolved marketplace instead of
 * letting the page render with a bogus country and silently fall back
 * to GE in JS (which is the worst outcome - URL says one thing, UI
 * says another).
 */
function looksLikeCountrySegment(segment: string | undefined): boolean {
  return !!segment && /^[a-z]{2}$/i.test(segment);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Path segments after the leading slash. `["ge", "professionals"]`
  // for `/ge/professionals`. `[""]` for `/`.
  const segments = pathname.replace(/^\/+/, '').split('/');
  const first = segments[0]?.toLowerCase();
  const firstUpper = first?.toUpperCase();

  // Already a valid country-prefixed URL?
  if (firstUpper && (SUPPORTED_COUNTRIES as readonly string[]).includes(firstUpper)) {
    // Only a handful of routes actually live under `app/[country]/`
    // (pros, jobs, tools, the marketplace landing, etc.). Everything
    // else is a GLOBAL route (shop, projects, orders, settings, my-space,
    // admin, legal...) that has no `[country]` equivalent - so a
    // country-prefixed URL like `/ge/shop` would 404. When that happens,
    // strip the prefix and redirect to the canonical bare path so every
    // route is reachable with OR without a country prefix.
    const sub = segments[1]?.toLowerCase();
    const subNext = segments[2]?.toLowerCase();
    const isCountryScoped =
      !sub || // bare `/ge` -> marketplace landing
      COUNTRY_SCOPED_FIRST_SEGMENTS.has(sub) ||
      (!!subNext && (COUNTRY_SCOPED_NESTED[sub]?.has(subNext) ?? false));

    if (!isCountryScoped) {
      const url = req.nextUrl.clone();
      url.pathname = '/' + segments.slice(1).join('/');
      url.search = search;
      const res = NextResponse.redirect(url, 307);
      res.cookies.set(COUNTRY_COOKIE, firstUpper, {
        path: '/',
        maxAge: COUNTRY_COOKIE_MAX_AGE,
        sameSite: 'lax',
      });
      return res;
    }

    // Genuine country-scoped route - pass through, refreshing the
    // sticky-preference cookie so future bare-path visits land here too.
    const res = NextResponse.next();
    res.cookies.set(COUNTRY_COOKIE, firstUpper, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Bare root: send to the resolved marketplace's landing.
  if (pathname === '/' || pathname === '') {
    const marketplace = resolveMarketplace(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${marketplace.toLowerCase()}`;
    const res = NextResponse.redirect(url, 307);
    res.cookies.set(COUNTRY_COOKIE, marketplace, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Looks-like-a-country prefix that ISN'T supported (e.g. /li/...,
  // /am/...). Rewrite just the country segment to the resolved
  // marketplace, preserving everything after it. This avoids the
  // "URL says LI but UI shows GE because useCountry silently falls
  // back" mismatch the user reported.
  //
  // Note: this catches benign two-letter routes that aren't countries
  // (we don't currently have any - if `/ui` or similar gets added
  // later, exclude it explicitly here).
  if (looksLikeCountrySegment(first)) {
    const marketplace = resolveMarketplace(req);
    const remainder = '/' + segments.slice(1).join('/');
    const url = req.nextUrl.clone();
    url.pathname = `/${marketplace.toLowerCase()}${remainder === '/' ? '' : remainder}`;
    url.search = search;
    const res = NextResponse.redirect(url, 307);
    res.cookies.set(COUNTRY_COOKIE, marketplace, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Bare marketplace route? `/professionals`, `/jobs/123`, `/post-job`,
  // `/become-pro`, `/how-it-works`, `/for-business`, `/tools/...` -
  // redirect into the resolved marketplace, preserving the rest of the
  // path and any query string.
  if (first && COUNTRY_SCOPED_FIRST_SEGMENTS.has(first)) {
    const marketplace = resolveMarketplace(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${marketplace.toLowerCase()}${pathname}`;
    url.search = search;
    const res = NextResponse.redirect(url, 307);
    res.cookies.set(COUNTRY_COOKIE, marketplace, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Nested country-scoped routes (e.g. `/pro/premium/...`) where the
  // FIRST segment is shared with country-agnostic siblings
  // (`/pro/profile-setup/`, `/pro/portfolio/`).
  const second = segments[1]?.toLowerCase();
  if (first && second && COUNTRY_SCOPED_NESTED[first]?.has(second)) {
    const marketplace = resolveMarketplace(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${marketplace.toLowerCase()}${pathname}`;
    url.search = search;
    const res = NextResponse.redirect(url, 307);
    res.cookies.set(COUNTRY_COOKIE, marketplace, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Country-agnostic route (admin, settings, login, etc.) - pass through.
  return NextResponse.next();
}

/**
 * Skip the middleware for asset paths and Next internals where the
 * country prefix would be meaningless and the regex overhead would
 * add up on every static file.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static / _next/image / _next/data (build assets)
     *   - api routes (handled at the controller level)
     *   - file extensions (anything with a dot - images, fonts, JSON,
     *     manifest, sitemap, robots)
     *   - favicon
     */
    '/((?!_next/static|_next/image|_next/data|api|.*\\..*|favicon.ico).*)',
  ],
};
