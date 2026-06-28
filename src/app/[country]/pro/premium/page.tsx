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
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatPremiumDate, isPremiumRefundable } from "@/utils/premium";
import { ArrowRight, BadgeCheck, Check, Crown, Star, TrendingUp } from "lucide-react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Single launch plan: Pro, monthly only.
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

const HIGHLIGHTS = [
  {
    icon: TrendingUp,
    title: { en: "Top of search", ka: "ძიების თავში", ru: "Вверху поиска" },
    body: {
      en: "Appear above other pros, where clients look first.",
      ka: "გამოჩნდი სხვებზე მაღლა, სადაც კლიენტი პირველ რიგში იხედება.",
      ru: "Будьте выше других мастеров, где клиент смотрит первым.",
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
    title: { en: "A badge clients trust", ka: "ბეჯი, რომელსაც ენდობიან", ru: "Бейдж доверия" },
    body: {
      en: "Stand out as a verified premium pro.",
      ka: "გამოირჩიე გადამოწმებული ბეჯით.",
      ru: "Выделяйтесь проверенным бейджем.",
    },
  },
];

export default function PremiumPlansPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { t, pick, locale } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const cl = useCountryLink();
  const country = useCountry();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isPro = user?.role === "pro";
  // `/users/me` already expiry-checks these, returning "none"/false once a
  // subscription lapses - so an active tier here is always live.
  const currentTier =
    user?.isPremium && user.premiumTier ? user.premiumTier : "none";
  const premiumExpiresAt = user?.premiumExpiresAt;
  const isActive = currentTier !== "none";
  const refundable = isActive && isPremiumRefundable(user?.premiumStartedAt);

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

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await api.post<{ refunded?: boolean }>(
        "/payments/premium/cancel",
      );
      await refreshUser();
      setCancelOpen(false);
      toast.success(
        pick({ en: "Subscription cancelled", ka: "გამოწერა გაუქმდა", ru: "Подписка отменена" }),
        data?.refunded
          ? pick({
              en: "Your refund is on the way.",
              ka: "თანხა მალე დაგიბრუნდებათ.",
              ru: "Возврат уже в пути.",
            })
          : undefined,
      );
    } catch (err) {
      const msg =
        isAxiosError(err) && typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : pick({ en: "Couldn't cancel - try again.", ka: "გაუქმება ვერ მოხერხდა.", ru: "Не удалось отменить." });
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main className="mx-auto max-w-5xl px-5 sm:px-6">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="pt-16 pb-10 text-center sm:pt-24">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--hm-brand-500)]">
            Homico Premium
          </p>
          <h1 className="mx-auto max-w-2xl text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[48px]">
            {pick({
              en: "Get seen first. Win more jobs.",
              ka: "გამოჩნდი პირველი. მიიღე მეტი შეკვეთა.",
              ru: "Будьте на виду. Получайте больше заказов.",
            })}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--hm-fg-muted)]">
            {pick({
              en: "Premium puts you at the top of search and on the homepage - right where clients decide who to call.",
              ka: "Premium გამოგაჩენს ძიების თავში და მთავარ გვერდზე. იქ, სადაც კლიენტი ირჩევს ვის დაურეკოს.",
              ru: "Premium выводит вас вверх поиска и на главную - там, где клиент решает, кому позвонить.",
            })}
          </p>
        </section>

        {/* ── Plan card (light) ─────────────────────────────── */}
        <section className="mx-auto max-w-md">
          <div className="overflow-hidden rounded-3xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] shadow-[var(--hm-shadow-md)]">
            <div className="p-7 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hm-brand-500)]/[0.1]">
                    <Crown className="h-4 w-4 text-[var(--hm-brand-500)]" strokeWidth={1.75} />
                  </span>
                  <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[var(--hm-fg-primary)]">
                    {pick({ en: "Pro", ka: "პრო", ru: "Pro" })}
                  </h2>
                </div>
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-success-500)]/[0.12] px-2.5 py-1 text-[11px] font-semibold text-[var(--hm-success-600)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--hm-success-500)]" />
                    {t("header.premiumActive")}
                  </span>
                )}
              </div>

              {isActive ? (
                <p className="mt-5 text-[15px] text-[var(--hm-fg-muted)]">
                  {premiumExpiresAt
                    ? t("header.premiumActiveUntil", {
                        date: formatPremiumDate(premiumExpiresAt, locale),
                      })
                    : t("header.premiumActive")}
                </p>
              ) : (
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-[52px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-[var(--hm-fg-primary)]">
                    {currency}
                    {price}
                  </span>
                  <span className="text-[14px] text-[var(--hm-fg-muted)]">
                    / {t("premium.mo")}
                  </span>
                </div>
              )}

              <Button
                size="lg"
                className="mt-7 w-full"
                asChild={isActive}
                onClick={isActive ? undefined : handleSelectPlan}
              >
                {isActive ? (
                  <a href="/pro/profile-setup">
                    {pick({ en: "Manage your profile", ka: "პროფილის მართვა", ru: "Управлять профилем" })}
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </a>
                ) : (
                  <>
                    {t("premium.getStarted")}
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </>
                )}
              </Button>

              {isActive ? (
                refundable ? (
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    className="mt-3.5 w-full text-center text-[12px] text-[var(--hm-fg-muted)] underline-offset-4 transition-colors hover:text-[var(--hm-error-500)] hover:underline"
                  >
                    {pick({
                      en: "Cancel & get a full refund",
                      ka: "გააუქმე და დაიბრუნე თანხა",
                      ru: "Отменить и вернуть деньги",
                    })}
                  </button>
                ) : (
                  <p className="mt-3.5 text-center text-[12px] text-[var(--hm-fg-muted)]">
                    {pick({
                      en: "Your plan won't auto-renew",
                      ka: "გეგმა ავტომატურად არ განახლდება",
                      ru: "Тариф не продлевается автоматически",
                    })}
                  </p>
                )
              ) : (
                <p className="mt-3.5 text-center text-[12px] text-[var(--hm-fg-muted)]">
                  {pick({
                    en: "3-day money-back guarantee",
                    ka: "3 დღიანი თანხის დაბრუნების გარანტია",
                    ru: "Возврат денег в течение 3 дней",
                  })}
                </p>
              )}
            </div>

            {/* What's included */}
            <div className="border-t border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)]/40 p-7 sm:p-8">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--hm-fg-subtle)]">
                {t("premium.includes")}
              </p>
              <ul className="space-y-3">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] text-[var(--hm-fg-primary)]">
                    <Check className="h-4 w-4 shrink-0 text-[var(--hm-brand-500)]" strokeWidth={2.25} />
                    {pick(f)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Feature highlights ────────────────────────────── */}
        <section className="border-t border-[var(--hm-border-subtle)] py-16 sm:py-20 mt-20">
          <div className="grid gap-10 sm:grid-cols-3">
            {HIGHLIGHTS.map((h, i) => {
              const Icon = h.icon;
              return (
                <div key={i}>
                  <Icon className="h-5 w-5 text-[var(--hm-brand-500)]" strokeWidth={1.75} />
                  <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.01em] text-[var(--hm-fg-primary)]">
                    {pick(h.title)}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--hm-fg-muted)]">
                    {pick(h.body)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Trust ─────────────────────────────────────────── */}
        <section className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-[var(--hm-border-subtle)] py-12 pb-24">
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
              {VERIFIED_PROS}
            </span>
            <span className="text-[13px] text-[var(--hm-fg-muted)]">
              {pick({ en: "verified pros", ka: "გადამოწმებული ოსტატი", ru: "проверенных мастеров" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
              {AVG_RATING}
              <Star className="h-4 w-4 fill-[var(--hm-brand-500)] text-[var(--hm-brand-500)]" />
            </span>
            <span className="text-[13px] text-[var(--hm-fg-muted)]">
              {pick({ en: "average rating", ka: "საშუალო შეფასება", ru: "средний рейтинг" })}
            </span>
          </div>
        </section>
      </main>

      <ConfirmModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        variant="danger"
        isLoading={cancelling}
        title={pick({
          en: "Cancel your Pro plan?",
          ka: "გავაუქმოთ პრო გეგმა?",
          ru: "Отменить тариф Pro?",
        })}
        description={pick({
          en: "You're within the 3-day window, so you'll get a full refund and Pro will end right away.",
          ka: "ხარ 3 დღიან ვადაში, ამიტომ თანხას სრულად დაგიბრუნებთ და პრო მაშინვე დასრულდება.",
          ru: "Вы в пределах 3 дней, поэтому получите полный возврат, а Pro завершится сразу.",
        })}
        confirmLabel={pick({
          en: "Cancel & refund",
          ka: "გაუქმება და დაბრუნება",
          ru: "Отменить и вернуть",
        })}
        cancelLabel={pick({ en: "Keep Pro", ka: "დატოვე პრო", ru: "Оставить Pro" })}
        loadingLabel={pick({ en: "Cancelling...", ka: "უქმდება...", ru: "Отмена..." })}
      />
    </div>
  );
}
