/**
 * Feature flags for gating in-progress functionality.
 *
 * Set via `NEXT_PUBLIC_FEATURE_*` env vars at build time. Anything not set
 * defaults to OFF — production builds opt in explicitly.
 *
 * Usage:
 *   import { features } from '@/config/features';
 *   if (features.bookings) { ... }
 */

const flag = (name: string, fallback = false): boolean => {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

export const features = {
  /** Bookings + scheduling. OFF until payment provider is integrated. */
  bookings: flag('NEXT_PUBLIC_FEATURE_BOOKINGS'),
  /** Payment methods (settings tab, saved cards). OFF until payment provider is integrated. */
  payments: flag('NEXT_PUBLIC_FEATURE_PAYMENTS'),
  /** Self-service account deletion. OFF until backend deletion + retention policy is finalized. */
  accountDeletion: flag('NEXT_PUBLIC_FEATURE_ACCOUNT_DELETION'),
  /** Email notifications & email settings. OFF until SendGrid is configured. */
  email: flag('NEXT_PUBLIC_FEATURE_EMAIL'),
} as const;
