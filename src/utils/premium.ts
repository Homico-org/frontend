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
  elite: { en: "Elite", ka: "ელიტა", ru: "Elite" },
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

/** True while a just-started premium plan is still inside the refund window. */
export function isPremiumRefundable(startedAt: string | undefined): boolean {
  if (!startedAt) return false;
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return false;
  const windowMs = PREMIUM_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - start <= windowMs;
}
