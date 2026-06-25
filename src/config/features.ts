/**
 * Feature flags for gating in-progress functionality.
 *
 * Set via `NEXT_PUBLIC_FEATURE_*` env vars at build time. Anything not set
 * defaults to OFF - production builds opt in explicitly.
 *
 * IMPORTANT: each env var MUST be accessed via literal dot notation
 * (e.g. `process.env.NEXT_PUBLIC_FEATURE_BOOKINGS`). Next.js's
 * DefinePlugin only inlines `NEXT_PUBLIC_*` into the CLIENT bundle when
 * the key is a literal at parse time. Bracket access with a variable
 * key (`process.env[name]`) silently resolves to `undefined` in the
 * browser, so every flag is always-false on the client even when the
 * env var is set. That mismatch makes the page render correctly during
 * SSR but switch to a 404 on hydration. Keep the literal-dot pattern.
 *
 * Usage:
 *   import { features } from '@/config/features';
 *   if (features.bookings) { ... }
 */

const parseFlag = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

export const features = {
  /** Bookings + scheduling. OFF until payment provider is integrated. */
  bookings: parseFlag(process.env.NEXT_PUBLIC_FEATURE_BOOKINGS),
  /** Payment methods (settings tab, saved cards). OFF until payment provider is integrated. */
  payments: parseFlag(process.env.NEXT_PUBLIC_FEATURE_PAYMENTS),
  /** Self-service account deletion. OFF until backend deletion + retention policy is finalized. */
  accountDeletion: parseFlag(process.env.NEXT_PUBLIC_FEATURE_ACCOUNT_DELETION),
  /** Email notifications & email settings. OFF until SendGrid is configured. */
  email: parseFlag(process.env.NEXT_PUBLIC_FEATURE_EMAIL),
  /**
   * Marketplace / country switcher in the header (GE / FR / etc.).
   * OFF while the international rollout is still in prep - all visitors
   * stay on the GE marketplace by default. Flip on once the non-GE
   * catalogs + pricing + city lists are seeded for additional countries.
   */
  marketplaceSelector: parseFlag(process.env.NEXT_PUBLIC_FEATURE_MARKETPLACE_SELECTOR),
  /**
   * Pro premium pricing page (`/pro/premium` + checkout/success). OFF in
   * production until the paid-subscription launch is announced - the page
   * shipped earlier but must not be publicly reachable yet. Stays ON on
   * dev for internal testing (set NEXT_PUBLIC_FEATURE_PREMIUM_PAGE=true).
   * When disabled, the header link is hidden AND the middleware bounces
   * any /pro/premium* URL (direct or shared) to the home landing.
   */
  premiumPage: parseFlag(process.env.NEXT_PUBLIC_FEATURE_PREMIUM_PAGE),
} as const;
