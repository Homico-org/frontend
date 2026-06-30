import type { Locale } from "@/contexts/LanguageContext";

export type PremiumTier = "none" | "basic" | "pro" | "elite";

type Pick = (values: Partial<Record<Locale, string | undefined>>) => string;

// Display names for each paid tier. `basic` is sold as plain "Premium";
// brand-style names (Pro / Elite) stay Latin across locales, only the
// generic "Premium" word gets a Georgian/Russian form.
const TIER_NAMES: Record<
  Exclude<PremiumTier, "none">,
  Partial<Record<Locale, string>>
> = {
  basic: { en: "Premium", ka: "პრემიუმ", ru: "Premium" },
  pro: { en: "Pro", ka: "პრო", ru: "Pro" },
  // `elite` is the internal id; it ships to users as "Super Pro".
  elite: { en: "Super Pro", ka: "სუპერ პრო", ru: "Супер Pro" },
};

/** True only while the tier is a real, non-"none" paid plan. */
export function isPaidTier(tier: string | undefined | null): boolean {
  return !!tier && tier !== "none";
}

/** Localized display name for a premium tier ("" for none/unknown). */
export function premiumTierName(tier: string | undefined, pick: Pick): string {
  if (!isPaidTier(tier)) return "";
  const names = TIER_NAMES[tier as Exclude<PremiumTier, "none">] ?? TIER_NAMES.basic;
  return pick(names);
}

// Hand-written short month tables. The deployed Node/browser runtime ships
// minimal ICU data, so `toLocaleDateString('ka-GE', { month: 'short' })`
// silently falls back to English ("Jun" instead of "ივნ") - the same trap
// dateUtils.ts documents. These tables guarantee a localized month.
const MONTHS_SHORT: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ka: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
  ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
};

/** Locale-aware "27 ივნ 2026"-style date for an expiry timestamp ("" if absent/invalid). */
export function formatPremiumDate(
  date: string | undefined,
  locale: Locale,
): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const month = (MONTHS_SHORT[locale] ?? MONTHS_SHORT.en)[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  // English reads "Jun 28, 2027"; ka/ru read "28 ივნ 2027".
  return locale === "en" ? `${month} ${day}, ${year}` : `${day} ${month} ${year}`;
}

// A premium plan can be cancelled for a full refund only within this many
// days of starting it. After that it simply runs to expiry (no auto-renew).
export const PREMIUM_REFUND_WINDOW_DAYS = 3;

/**
 * True while a just-started premium plan is still inside the refund window.
 * Prefers the explicit start; if it isn't populated yet (older API response /
 * stale cache) it derives the start from the monthly expiry (expiry - 30d).
 *
 * The window is `0 <= age <= windowMs` — the lower bound matters: a manually
 * granted badge has no start and a far-future expiry (e.g. 2099), which makes
 * the derived start land in the FUTURE (negative age). Without the `>= 0`
 * guard that read as "refundable" and showed a "Cancel & get a full refund"
 * button the backend then rejected (no payment to refund). If neither
 * timestamp yields a valid in-window age we fail CLOSED.
 */
export function isPremiumRefundable(
  startedAt?: string,
  expiresAt?: string,
): boolean {
  const windowMs = PREMIUM_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const inWindow = (startMs: number) => {
    const age = Date.now() - startMs;
    return age >= 0 && age <= windowMs;
  };
  const startMs = startedAt ? new Date(startedAt).getTime() : NaN;
  if (!Number.isNaN(startMs)) return inWindow(startMs);
  const expMs = expiresAt ? new Date(expiresAt).getTime() : NaN;
  if (!Number.isNaN(expMs)) {
    return inWindow(expMs - 30 * 24 * 60 * 60 * 1000);
  }
  return false;
}
