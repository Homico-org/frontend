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
import { ArrowRight, Check, Crown, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Single launch plan: Pro, monthly only. The multi-tier comparison, the
// billing toggle, and the marketing sections were retired for the
// premium-only MVP - one plan, one price, one decision.
const PLAN_ID = "pro";
const VERIFIED_PROS = "650+";
const AVG_RATING = "4.9";

const PRO_FEATURES: Record<"en" | "ka" | "ru", string>[] = [
  { en: "Top of search results", ka: "ძიების პირველ ადგილზე", ru: "Топ результатов поиска" },
  { en: "Featured on the homepage", ka: "მთავარ გვერდზე გამოჩენა", ru: "На главной странице" },
  { en: "Pro badge on your profile", ka: "პრო ბეჯი პროფილზე", ru: "Pro-бейдж в профиле" },
  { en: "5x more profile views", ka: "5x მეტი ნახვა", ru: "5x больше просмотров" },
  { en: "Priority support", ka: "პრიორიტეტული მხარდაჭერა", ru: "Приоритетная поддержка" },
];

// "You're #1 in search" - shows what premium actually does. Monochrome +
// one brand-highlighted winning row; theme-safe via --hm tokens.
function SearchRankVisual() {
  const { pick } = useLanguage();
  return (
    <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--hm-fg-subtle)]">
          {pick({ en: "Search · plumbers", ka: "ძიება · სანტექნიკოსი", ru: "Поиск · сантехники" })}
        </span>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--hm-brand-500)] opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--hm-brand-500)]" />
        </span>
      </div>

      {/* Winner - you, #1 */}
      <div className="flex items-center gap-3 rounded-xl border border-[var(--hm-brand-500)]/25 bg-[var(--hm-brand-500)]/[0.05] p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hm-brand-500)] text-[12px] font-semibold text-white">
          {pick({ en: "You", ka: "შენ", ru: "Вы" })}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
              {pick({ en: "Your profile", ka: "შენი პროფილი", ru: "Ваш профиль" })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hm-brand-500)]/12 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.08em] text-[var(--hm-brand-600)]">
              <Crown className="h-2.5 w-2.5" strokeWidth={2} />
              Pro
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--hm-fg-muted)]">
            <Star className="h-3 w-3 fill-[var(--hm-brand-500)] text-[var(--hm-brand-500)]" />
            {AVG_RATING} · {pick({ en: "top match", ka: "საუკეთესო შედეგი", ru: "лучшее совпадение" })}
          </div>
        </div>
        <span className="font-mono text-[16px] font-medium text-[var(--hm-brand-500)]">#1</span>
      </div>

      {/* Everyone else */}
      {[2, 3, 4].map((n) => (
        <div key={n} className="mt-2 flex items-center gap-3 px-3 py-2.5 opacity-45">
          <span className="h-8 w-8 shrink-0 rounded-full bg-[var(--hm-bg-tertiary)]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <span className="block h-2.5 w-24 rounded bg-[var(--hm-bg-tertiary)]" />
            <span className="block h-2 w-16 rounded bg-[var(--hm-bg-tertiary)]" />
          </div>
          <span className="font-mono text-[12px] text-[var(--hm-fg-subtle)]">#{n}</span>
        </div>
      ))}

      <p className="mt-5 text-[12px] text-[var(--hm-fg-muted)]">
        {pick({
          en: "Premium keeps you on top, where clients look first.",
          ka: "Premium გამოგაჩენს თავში, სადაც კლიენტი პირველ რიგში იხედება.",
          ru: "Premium держит вас вверху, где клиент смотрит первым.",
        })}
      </p>
    </div>
  );
}

export default function PremiumPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, pick, locale } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const cl = useCountryLink();
  const country = useCountry();

  const isPro = user?.role === "pro";
  // `/users/me` already expiry-checks these, returning "none"/false once a
  // subscription lapses - so an active tier here is always live.
  const currentTier =
    user?.isPremium && user.premiumTier ? user.premiumTier : "none";
  const premiumExpiresAt = user?.premiumExpiresAt;
  const isActive = currentTier !== "none";

  const price = getPremiumTierPrices(country, PLAN_ID).monthly;
  const currency = currencySymbol({ country });

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
    router.push(cl(`/pro/premium/checkout?tier=${PLAN_ID}&period=monthly`));
  };

  // Inverted "ink" card surface - dark in light mode, light in dark mode.
  const onCardMuted = "color-mix(in srgb, var(--hm-bg-elevated) 60%, transparent)";
  const onCardHairline = "color-mix(in srgb, var(--hm-bg-elevated) 14%, transparent)";

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main className="mx-auto flex min-h-[calc(100vh-var(--hm-header-h,72px))] max-w-5xl items-center px-5 py-14 sm:px-6">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_minmax(360px,400px)] lg:gap-16">
          {/* ── Left: pitch + proof ─────────────────────────────── */}
          <div>
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

            <div className="mt-9 max-w-md">
              <SearchRankVisual />
            </div>

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

          {/* ── Right: the offer (or membership when active) ────── */}
          <div className="rounded-[20px] bg-[var(--hm-fg-primary)] p-7 shadow-[var(--hm-shadow-lg)] sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-[18px] w-[18px] text-[var(--hm-brand-400)]" strokeWidth={1.75} />
                <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--hm-bg-elevated)]">
                  {pick({ en: "Pro", ka: "პრო", ru: "Pro" })}
                </h2>
              </div>
              {isActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-success-500)]/20 px-2.5 py-1 text-[11px] font-semibold text-[var(--hm-success-500)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--hm-success-500)]" />
                  {t("header.premiumActive")}
                </span>
              )}
            </div>

            {isActive ? (
              <p className="mt-5 text-[15px] font-light" style={{ color: onCardMuted }}>
                {premiumExpiresAt
                  ? t("header.premiumActiveUntil", {
                      date: formatPremiumDate(premiumExpiresAt, locale),
                    })
                  : t("header.premiumActive")}
              </p>
            ) : (
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[52px] font-light leading-none tabular-nums tracking-[-0.03em] text-[var(--hm-bg-elevated)]">
                  {currency}
                  {price}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: onCardMuted }}>
                  / {t("premium.mo")}
                </span>
              </div>
            )}

            <div className="my-7 h-px" style={{ background: onCardHairline }} />

            <ul className="space-y-3.5">
              {PRO_FEATURES.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-[14px] text-[var(--hm-bg-elevated)]"
                >
                  <Check className="h-4 w-4 shrink-0 text-[var(--hm-brand-400)]" strokeWidth={2.25} />
                  {pick(f)}
                </li>
              ))}
            </ul>

            {isActive ? (
              <Button
                asChild
                size="lg"
                className="mt-8 w-full bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] hover:opacity-90"
              >
                <a href="/pro/profile-setup">
                  {pick({ en: "Manage your profile", ka: "პროფილის მართვა", ru: "Управлять профилем" })}
                  <ArrowRight className="h-[18px] w-[18px]" />
                </a>
              </Button>
            ) : (
              <Button size="lg" className="mt-8 w-full" onClick={handleSelectPlan}>
                {t("premium.getStarted")}
                <ArrowRight className="h-[18px] w-[18px]" />
              </Button>
            )}

            <p className="mt-4 text-center text-[12px]" style={{ color: onCardMuted }}>
              {isActive
                ? pick({ en: "Cancel anytime", ka: "გააუქმე ნებისმიერ დროს", ru: "Отмена в любой момент" })
                : pick({
                    en: "7-day money-back · cancel anytime",
                    ka: "7 დღიანი თანხის დაბრუნება · გააუქმე ნებისმიერ დროს",
                    ru: "Возврат 7 дней · отмена в любой момент",
                  })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
