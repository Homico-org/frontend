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

/** Locale-aware "27 Jun 2026"-style date for an expiry timestamp ("" if absent/invalid). */
export function formatPremiumDate(
  date: string | undefined,
  locale: Locale,
): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(
    locale === "en" ? "en-US" : locale === "ru" ? "ru-RU" : "ka-GE",
    { day: "numeric", month: "short", year: "numeric" },
  );
}
