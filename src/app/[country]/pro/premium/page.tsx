"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCountry, useCountryLink } from "@/hooks/useCountry";
import { getPremiumTierPrices } from "@/data/premium-pricing";
import { currencySymbol } from "@/utils/currency";
import { features } from "@/config/features";
import { formatPremiumDate, premiumTierName } from "@/utils/premium";
import { ArrowRight, BadgeCheck, Check, Crown, Star, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Single launch plan: Pro. The multi-tier comparison + marketing sections
// were retired for the premium-only MVP - one plan, one decision.
const PLAN_ID = "pro";
const VERIFIED_PROS = "650+";
const AVG_RATING = "4.9";

type BillingPeriod = "monthly" | "yearly";

const PRO_FEATURES: Record<"en" | "ka" | "ru", string>[] = [
  { en: "Top of search results", ka: "ძიების პირველ ადგილზე", ru: "Топ результатов поиска" },
  { en: "Featured on the homepage", ka: "მთავარ გვერდზე გამოჩენა", ru: "На главной странице" },
  { en: "Pro badge on your profile", ka: "პრო ბეჯი პროფილზე", ru: "Pro-бейдж в профиле" },
  { en: "5x more profile views", ka: "5x მეტი ნახვა", ru: "5x больше просмотров" },
  { en: "Priority support", ka: "პრიორიტეტული მხარდაჭერა", ru: "Приоритетная поддержка" },
];

const VALUE_POINTS = [
  {
    icon: TrendingUp,
    title: { en: "Top of search", ka: "ძიების თავში", ru: "Вверху поиска" },
    body: {
      en: "Clients see you before anyone else.",
      ka: "კლიენტი პირველ რიგში შენ გხედავს.",
      ru: "Клиент видит вас первым.",
    },
  },
  {
    icon: Star,
    title: { en: "On the homepage", ka: "მთავარ გვერდზე", ru: "На главной" },
    body: {
      en: "A featured spot where demand starts.",
      ka: "გამორჩეული ადგილი, სადაც ძიება იწყება.",
      ru: "Заметное место, где начинается спрос.",
    },
  },
  {
    icon: BadgeCheck,
    title: { en: "A badge that builds trust", ka: "ბეჯი, რომელიც ანდობს", ru: "Бейдж доверия" },
    body: {
      en: "Stand out as a verified premium pro.",
      ka: "გამოირჩიე გადამოწმებული ბეჯით.",
      ru: "Выделяйтесь проверенным бейджем.",
    },
  },
];

export default function PremiumPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, pick, locale } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const cl = useCountryLink();
  const country = useCountry();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");

  const isPro = user?.role === "pro";
  // `/users/me` already expiry-checks these, returning "none"/false once a
  // subscription lapses - so an active tier here is always live.
  const currentTier =
    user?.isPremium && user.premiumTier ? user.premiumTier : "none";
  const premiumExpiresAt = user?.premiumExpiresAt;
  const isActive = currentTier !== "none";

  const prices = getPremiumTierPrices(country, PLAN_ID);
  const currency = currencySymbol({ country });
  const price = prices[billingPeriod];
  const yearlySaving = prices.monthly * 12 - prices.yearly;

  useEffect(() => {
    trackEvent(AnalyticsEvent.PREMIUM_VIEW);
  }, [trackEvent]);

  const handleSelectPlan = () => {
    if (!features.premium || isActive) return;
    if (!isAuthenticated) {
      router.push("/register?redirect=/pro/premium");
      return;
    }
    if (!isPro) {
      router.push(cl(`/become-pro?redirect=${encodeURIComponent(cl("/pro/premium"))}`));
      return;
    }
    trackEvent(AnalyticsEvent.PREMIUM_CHECKOUT_START, {
      planType: PLAN_ID,
      planPrice: price,
    });
    router.push(cl(`/pro/premium/checkout?tier=${PLAN_ID}&period=${billingPeriod}`));
  };

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main className="mx-auto flex min-h-[calc(100vh-var(--hm-header-h,72px))] max-w-5xl items-center px-5 py-14 sm:px-6">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_minmax(360px,420px)] lg:gap-16">
          {/* ── Left: pitch + trust ─────────────────────────────── */}
          <div>
            {isActive && (
              <div className="mb-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[var(--hm-success-500)]/30 bg-[var(--hm-success-500)]/[0.08] px-4 py-2.5 text-[13px] text-[var(--hm-success-600)]">
                <Crown className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="font-semibold">
                  {premiumTierName(currentTier, pick)} {t("premium.plan")}
                </span>
                <span className="text-[var(--hm-fg-muted)]">
                  {premiumExpiresAt
                    ? t("header.premiumActiveUntil", {
                        date: formatPremiumDate(premiumExpiresAt, locale),
                      })
                    : t("header.premiumActive")}
                </span>
              </div>
            )}

            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hm-fg-subtle)]">
              Homico Premium
            </p>
            <h1 className="text-[36px] font-light leading-[1.04] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[52px]">
              {pick({ en: "Show up first,", ka: "გამოჩნდი პირველი,", ru: "Будьте первым," })}{" "}
              <span className="italic">
                {pick({ en: "win more jobs", ka: "მიიღე მეტი შეკვეთა", ru: "получайте больше заказов" })}
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] font-light leading-relaxed text-[var(--hm-fg-muted)] sm:text-[16px]">
              {pick({
                en: "Premium pros appear at the top of search, on the homepage, and with a standout badge - right where clients decide who to call.",
                ka: "Premium ოსტატები ჩნდებიან ძიების თავში, მთავარ გვერდზე და გამორჩეული ბეჯით. იქ, სადაც კლიენტი ირჩევს.",
                ru: "Premium-мастера появляются вверху поиска, на главной странице и с заметным бейджем - там, где клиент выбирает.",
              })}
            </p>

            {/* Value points */}
            <ul className="mt-9 max-w-md divide-y divide-[var(--hm-border-subtle)] border-t border-[var(--hm-border-subtle)]">
              {VALUE_POINTS.map((vp, i) => {
                const Icon = vp.icon;
                return (
                  <li key={i} className="flex items-start gap-3.5 py-4">
                    <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--hm-brand-500)]" strokeWidth={1.75} />
                    <div>
                      <p className="text-[14px] font-medium text-[var(--hm-fg-primary)]">
                        {pick(vp.title)}
                      </p>
                      <p className="mt-0.5 text-[13px] font-light leading-relaxed text-[var(--hm-fg-muted)]">
                        {pick(vp.body)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Trust stats */}
            <div className="mt-9 flex items-center gap-10">
              <div>
                <p className="text-[24px] font-light tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
                  {VERIFIED_PROS}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
                  {pick({ en: "verified pros", ka: "გადამოწმებული ოსტატი", ru: "проверенных мастеров" })}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[24px] font-light tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
                  {AVG_RATING}
                  <Star className="h-4 w-4 fill-[var(--hm-fg-primary)] text-[var(--hm-fg-primary)]" />
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
                  {pick({ en: "average rating", ka: "საშუალო შეფასება", ru: "средний рейтинг" })}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: the single plan card ─────────────────────── */}
          <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-7 shadow-[var(--hm-shadow-sm)] sm:p-8">
            {/* Billing toggle */}
            <div className="mb-7 flex items-center justify-between">
              <div className="inline-flex items-center rounded-full bg-[var(--hm-bg-tertiary)] p-1">
                {(["monthly", "yearly"] as BillingPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setBillingPeriod(period)}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                      billingPeriod === period
                        ? "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-[var(--hm-shadow-xs)]"
                        : "text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                    }`}
                  >
                    {period === "monthly" ? t("premium.monthly") : t("premium.yearly")}
                  </button>
                ))}
              </div>
              {billingPeriod === "yearly" && yearlySaving > 0 && (
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--hm-success-600)]">
                  {pick({ en: "Save", ka: "დაზოგე", ru: "Скидка" })} {currency}
                  {yearlySaving}
                </span>
              )}
            </div>

            {/* Plan name + price */}
            <div className="flex items-center gap-2">
              <Crown className="h-[18px] w-[18px] text-[var(--hm-brand-500)]" strokeWidth={1.75} />
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--hm-fg-primary)]">
                {pick({ en: "Pro", ka: "პრო", ru: "Pro" })}
              </h2>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[48px] font-light leading-none tabular-nums tracking-[-0.03em] text-[var(--hm-fg-primary)]">
                {currency}
                {price}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--hm-fg-subtle)]">
                / {billingPeriod === "monthly" ? t("premium.mo") : t("premium.yr")}
              </span>
            </div>

            {/* Features */}
            <ul className="mt-7 space-y-3.5">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-[14px] text-[var(--hm-fg-primary)]">
                  <Check className="h-4 w-4 shrink-0 text-[var(--hm-brand-500)]" strokeWidth={2.25} />
                  {pick(f)}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              size="lg"
              className="mt-8 w-full"
              disabled={isActive}
              onClick={handleSelectPlan}
            >
              {isActive ? (
                t("premium.currentPlan")
              ) : (
                <>
                  {t("premium.getStarted")}
                  <ArrowRight className="h-[18px] w-[18px]" />
                </>
              )}
            </Button>

            {/* Reassurance */}
            <p className="mt-4 text-center text-[12px] text-[var(--hm-fg-muted)]">
              {pick({
                en: "7-day money-back guarantee · cancel anytime",
                ka: "7 დღიანი თანხის დაბრუნება · გააუქმე ნებისმიერ დროს",
                ru: "Возврат денег 7 дней · отмена в любой момент",
              })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
