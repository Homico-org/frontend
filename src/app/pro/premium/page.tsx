"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { features } from "@/config/features";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { formatPremiumDate, isPremiumRefundable } from "@/utils/premium";
import { ArrowRight, Check, Crown, Megaphone, Star } from "lucide-react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CURRENCY = "₾";
const PRICES: Record<string, number> = { pro: 100, elite: 250 };
const VERIFIED_PROS = "650+";
const AVG_RATING = "4.9";

type Loc = Record<"en" | "ka" | "ru", string>;

const PRO_FEATURES: Loc[] = [
  { en: "Top of search results", ka: "ძიების პირველ ადგილზე", ru: "Топ результатов поиска" },
  { en: "Featured on the homepage", ka: "მთავარ გვერდზე გამოჩენა", ru: "На главной странице" },
  { en: "Pro badge on your profile", ka: "პრო ბეჯი პროფილზე", ru: "Pro-бейдж в профиле" },
  { en: "5x more profile views", ka: "5x მეტი ნახვა", ru: "5x больше просмотров" },
];

const SUPER_PRO_FEATURES: Loc[] = [
  { en: "Everything in Pro", ka: "ყველაფერი Pro-დან", ru: "Всё из Pro" },
  { en: "Promotion on Facebook & Instagram", ka: "პრომოცია Facebook-სა და Instagram-ზე", ru: "Продвижение в Facebook и Instagram" },
  { en: "Content & storytelling made for you", ka: "კონტენტი და სთორითელინგი შენთვის", ru: "Контент и сторителлинг для вас" },
  { en: "Marketing & PR support", ka: "მარკეტინგი და PR მხარდაჭერა", ru: "Поддержка маркетинга и PR" },
];

// `pro` / `elite` are the internal tier ids; `elite` ships as "Super Pro".
const PLANS = [
  { id: "pro", icon: Crown, popular: false, features: PRO_FEATURES, compareAt: 0 },
  { id: "elite", icon: Megaphone, popular: true, features: SUPER_PRO_FEATURES, compareAt: 300 },
] as const;

export default function PremiumPlansPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { t, pick, locale } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isPro = user?.role === "pro";
  const currentTier =
    user?.isPremium && user.premiumTier ? user.premiumTier : "none";
  const isActive = currentTier !== "none";
  const refundable = isActive && isPremiumRefundable(user?.premiumStartedAt);

  useEffect(() => {
    trackEvent(AnalyticsEvent.PREMIUM_VIEW);
  }, [trackEvent]);

  const handleSelectPlan = (tierId: string) => {
    if (!features.premium || currentTier === tierId) return;
    if (!isAuthenticated) {
      router.push(`/register?redirect=/pro/premium`);
      return;
    }
    if (!isPro) {
      router.push(`/become-pro?redirect=/pro/premium`);
      return;
    }
    trackEvent(AnalyticsEvent.PREMIUM_CHECKOUT_START, {
      planType: tierId,
      planPrice: PRICES[tierId],
    });
    router.push(`/pro/premium/checkout?tier=${tierId}&period=monthly`);
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await api.post<{ refunded?: boolean }>("/payments/premium/cancel");
      await refreshUser();
      setCancelOpen(false);
      toast.success(
        pick({ en: "Subscription cancelled", ka: "გამოწერა გაუქმდა", ru: "Подписка отменена" }),
        data?.refunded
          ? pick({ en: "Your refund is on the way.", ka: "თანხა მალე დაგიბრუნდებათ.", ru: "Возврат уже в пути." })
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

      <main className="mx-auto flex min-h-[calc(100vh-var(--hm-header-h,72px))] max-w-3xl flex-col justify-center px-5 py-8">
        {/* ── Hero ──────────────────────────────────────────── */}
        <div className="text-center">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--hm-brand-500)]">
            Homico Premium
          </p>
          <h1 className="text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[34px]">
            {pick({
              en: "Get seen first. Win more jobs.",
              ka: "გამოჩნდი პირველი. მიიღე მეტი შეკვეთა.",
              ru: "Будьте на виду. Получайте больше заказов.",
            })}
          </h1>
        </div>

        {/* ── Plans ─────────────────────────────────────────── */}
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = PRICES[plan.id];
            const isCurrent = isActive && currentTier === plan.id;
            const showAnchor = plan.compareAt > price;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-[var(--hm-bg-elevated)] p-6 ${
                  plan.popular
                    ? "border-[var(--hm-brand-500)]/40 shadow-[var(--hm-shadow-md)]"
                    : "border-[var(--hm-border-subtle)]"
                }`}
              >
                {plan.popular && !isActive && (
                  <span className="absolute -top-2.5 left-6 rounded-full bg-[var(--hm-brand-500)] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-white">
                    {pick({ en: "Recommended", ka: "რეკომენდებული", ru: "Рекомендуем" })}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hm-brand-500)]/[0.1]">
                      <Icon className="h-4 w-4 text-[var(--hm-brand-500)]" strokeWidth={1.75} />
                    </span>
                    <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--hm-fg-primary)]">
                      {plan.id === "pro"
                        ? pick({ en: "Pro", ka: "პრო", ru: "Pro" })
                        : pick({ en: "Super Pro", ka: "სუპერ პრო", ru: "Супер Pro" })}
                    </h2>
                  </div>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-success-500)]/[0.12] px-2 py-0.5 text-[10px] font-semibold text-[var(--hm-success-600)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--hm-success-500)]" />
                      {t("header.premiumActive")}
                    </span>
                  )}
                </div>

                {/* Price / active */}
                {isCurrent ? (
                  <p className="mt-4 text-[13px] text-[var(--hm-fg-muted)]">
                    {user?.premiumExpiresAt
                      ? t("header.premiumActiveUntil", {
                          date: formatPremiumDate(user.premiumExpiresAt, locale),
                        })
                      : t("header.premiumActive")}
                  </p>
                ) : (
                  <div className="mt-4 flex items-baseline gap-2">
                    {showAnchor && (
                      <span className="text-[16px] font-medium text-[var(--hm-fg-subtle)] line-through">
                        {CURRENCY}
                        {plan.compareAt}
                      </span>
                    )}
                    <span className="text-[34px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-[var(--hm-fg-primary)]">
                      {CURRENCY}
                      {price}
                    </span>
                    <span className="text-[13px] text-[var(--hm-fg-muted)]">/ {t("premium.mo")}</span>
                  </div>
                )}

                {/* Features */}
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-[var(--hm-fg-primary)]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--hm-brand-500)]" strokeWidth={2.5} />
                      {pick(f)}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <>
                    <Button asChild size="default" variant="outline" className="mt-5 w-full">
                      <a href="/pro/profile-setup">
                        {pick({ en: "Manage profile", ka: "პროფილის მართვა", ru: "Профиль" })}
                      </a>
                    </Button>
                    {refundable ? (
                      <button
                        type="button"
                        onClick={() => setCancelOpen(true)}
                        className="mt-2.5 w-full text-center text-[11px] text-[var(--hm-fg-muted)] underline-offset-4 transition-colors hover:text-[var(--hm-error-500)] hover:underline"
                      >
                        {pick({ en: "Cancel & get a full refund", ka: "გააუქმე და დაიბრუნე თანხა", ru: "Отменить и вернуть деньги" })}
                      </button>
                    ) : (
                      <p className="mt-2.5 text-center text-[11px] text-[var(--hm-fg-muted)]">
                        {pick({ en: "Won't auto-renew", ka: "ავტომატურად არ განახლდება", ru: "Без автопродления" })}
                      </p>
                    )}
                  </>
                ) : isActive ? (
                  <p className="mt-5 text-center text-[12px] text-[var(--hm-fg-muted)]">
                    {pick({
                      en: "Cancel your current plan to switch",
                      ka: "გადასართავად ჯერ გააუქმე მიმდინარე გეგმა",
                      ru: "Чтобы сменить, отмените текущий тариф",
                    })}
                  </p>
                ) : (
                  <Button
                    size="default"
                    variant={plan.popular ? "default" : "outline"}
                    className="mt-5 w-full"
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {t("premium.getStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Trust ─────────────────────────────────────────── */}
        <div className="mt-7 flex items-center justify-center gap-5 text-[12px] text-[var(--hm-fg-muted)]">
          <span className="text-[var(--hm-fg-muted)]">
            {pick({ en: "3-day money-back guarantee", ka: "3 დღიანი თანხის დაბრუნება", ru: "Возврат денег 3 дня" })}
          </span>
          <span className="h-3 w-px bg-[var(--hm-border-strong)]" />
          <span className="flex items-center gap-1">
            <span className="font-semibold text-[var(--hm-fg-primary)]">{AVG_RATING}</span>
            <Star className="h-3 w-3 fill-[var(--hm-brand-500)] text-[var(--hm-brand-500)]" />
            · {VERIFIED_PROS} {pick({ en: "pros", ka: "ოსტატი", ru: "мастеров" })}
          </span>
        </div>
      </main>

      <ConfirmModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        variant="danger"
        isLoading={cancelling}
        title={pick({ en: "Cancel your plan?", ka: "გავაუქმოთ გეგმა?", ru: "Отменить тариф?" })}
        description={pick({
          en: "You're within the 3-day window, so you'll get a full refund and premium ends right away.",
          ka: "ხარ 3 დღიან ვადაში, ამიტომ თანხას სრულად დაგიბრუნებთ და პრემიუმი მაშინვე დასრულდება.",
          ru: "Вы в пределах 3 дней, поэтому получите полный возврат, а премиум завершится сразу.",
        })}
        confirmLabel={pick({ en: "Cancel & refund", ka: "გაუქმება და დაბრუნება", ru: "Отменить и вернуть" })}
        cancelLabel={pick({ en: "Keep it", ka: "დატოვე", ru: "Оставить" })}
        loadingLabel={pick({ en: "Cancelling...", ka: "უქმდება...", ru: "Отмена..." })}
      />
    </div>
  );
}
