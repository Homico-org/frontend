"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Header, { HeaderSpacer } from "@/components/common/Header";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { features } from "@/config/features";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCountry, useCountryLink } from "@/hooks/useCountry";
import { getPremiumTierPrices, type PremiumTierId } from "@/data/premium-pricing";
import { currencySymbol } from "@/utils/currency";
import PaymentMarks from "@/components/common/PaymentMarks";
import { ArrowLeft, ArrowUpRight, Check, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Tiers we currently sell. The offering is two tiers, MONTHLY only - the
// checkout must refuse anything else (e.g. ?tier=basic or ?period=yearly)
// rather than render/POST a plan that no longer exists.
const ALLOWED_TIERS = ["pro", "elite"] as const;
const ALLOWED_PERIODS = ["monthly"] as const;

const PREMIUM_TIERS: Record<
  string,
  {
    id: PremiumTierId;
    name: { en: string; ka: string };
    features: { en: string; ka: string }[];
  }
> = {
  pro: {
    id: "pro",
    name: { en: "Pro", ka: "პრო" },
    features: [
      { en: "Top of search results", ka: "ძიების პირველ ადგილზე" },
      { en: "Featured on the homepage", ka: "მთავარ გვერდზე გამოჩენა" },
      { en: "5x more profile views", ka: "5x მეტი ნახვა" },
      { en: "Priority support", ka: "პრიორიტეტული მხარდაჭერა" },
    ],
  },
  elite: {
    id: "elite",
    name: { en: "Super Pro", ka: "სუპერ პრო" },
    features: [
      { en: "Everything in Pro", ka: "ყველაფერი Pro-დან" },
      { en: "Promotion on Facebook & Instagram", ka: "პრომოცია Facebook-სა და Instagram-ზე" },
      { en: "Content & storytelling made for you", ka: "კონტენტი და სთორითელინგი შენთვის" },
      { en: "Marketing & PR support", ka: "მარკეტინგი და PR მხარდაჭერა" },
    ],
  },
};

function CheckoutContent() {
  const { t, pick } = useLanguage();
  const { error: toastError } = useToast();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cl = useCountryLink();
  const country = useCountry();

  const tierId = searchParams.get("tier") || "pro";
  const period = (searchParams.get("period") || "monthly") as "monthly" | "yearly";

  // Only the currently-offered combos are valid: tier in {pro, elite},
  // period === monthly. A URL with a stale/unknown tier (e.g. ?tier=basic)
  // or a retired period (?period=yearly) is bounced back to the plan page
  // so we never render a price or POST a checkout for a plan we don't sell.
  const isValidCombo =
    (ALLOWED_TIERS as readonly string[]).includes(tierId) &&
    (ALLOWED_PERIODS as readonly string[]).includes(period);

  useEffect(() => {
    if (!features.premium || !isValidCombo) router.replace(cl("/pro/premium"));
  }, [router, cl, isValidCombo]);

  const tier = isValidCombo ? PREMIUM_TIERS[tierId] : undefined;
  const tierPrices = tier ? getPremiumTierPrices(country, tier.id) : { monthly: 0, yearly: 0 };
  const price = tierPrices[period] || 0;
  const currency = currencySymbol({ country });
  const yearlySaving = tierPrices.monthly * 12 - tierPrices.yearly;

  const [isProcessing, setIsProcessing] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ finalAmount: number; code: string } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Effective price after any applied promo. Monthly-only at launch, so the
  // promo always discounts the monthly amount.
  const effectivePrice = promo ? promo.finalAmount : price;

  const PROMO_MESSAGES: Record<string, { en: string; ka: string }> = {
    INVALID_PROMO: { en: "Invalid code", ka: "არასწორი კოდი" },
    EXPIRED_PROMO: { en: "This code has expired", ka: "კოდს ვადა გაუვიდა" },
    PROMO_USED_UP: { en: "This code is used up", ka: "კოდი ამოწურულია" },
    PROMO_ALREADY_USED: { en: "You've already used this code", ka: "ამ კოდით უკვე ისარგებლეთ" },
    PROMO_NOT_FOR_TIER: { en: "Not valid for this plan", ka: "არ მოქმედებს ამ გეგმაზე" },
  };

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setApplyingPromo(true);
    setPromoErr("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/payments/premium/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier: tierId, period, promoCode: code, country }),
      });
      const data = (await res.json()) as {
        finalAmount?: number;
        discounted?: boolean;
        code?: string;
        message?: string;
      };
      if (!res.ok || !data?.discounted) {
        const m = PROMO_MESSAGES[String(data?.message || "")] || {
          en: "Code didn't apply",
          ka: "კოდი არ მოქმედებს",
        };
        setPromoErr(pick(m));
        setPromo(null);
        return;
      }
      setPromo({ finalAmount: data.finalAmount ?? price, code: data.code ?? code });
    } catch {
      setPromoErr(pick({ en: "Couldn't check the code", ka: "კოდის შემოწმება ვერ მოხერხდა" }));
    } finally {
      setApplyingPromo(false);
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      trackEvent(AnalyticsEvent.PREMIUM_PURCHASE, { planType: tierId, planPrice: effectivePrice });
      // Create a premium intent and hand off to the provider's hosted page.
      // The /pro/premium/return page reconciles + grants on the way back.
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/payments/premium/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier: tierId, period, promoCode: promo?.code, country }),
      });
      if (!res.ok) {
        // Already subscribed - one plan at a time. Bounce back with a clear note.
        let code = "";
        try {
          code = String(((await res.json()) as { message?: string })?.message || "");
        } catch {
          /* non-JSON body */
        }
        if (code.includes("ALREADY_PREMIUM")) {
          toastError(t("premium.alreadyActive"));
          router.replace(cl("/pro/premium"));
          return;
        }
        throw new Error(`Premium checkout failed (${res.status})`);
      }
      const data = (await res.json()) as { paymentId?: string; redirectUrl?: string };
      if (data.paymentId) sessionStorage.setItem("premiumPaymentId", data.paymentId);
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      throw new Error("No payment redirect URL returned");
    } catch (err) {
      console.error("[premium checkout]", err);
      toastError(t("common.error"));
      setIsProcessing(false);
    }
  };

  if (!tier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hm-bg-page)]">
        <p className="text-[var(--hm-fg-muted)]">{t("premium.planNotFound")}</p>
      </div>
    );
  }

  const periodLabel = period === "monthly" ? t("premium.mo") : t("premium.yr");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button
            onClick={() => router.push(cl("/pro/premium"))}
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-light text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            {pick({ en: "Back to plans", ka: "უკან გეგმებზე" })}
          </button>

          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--hm-fg-subtle)]">
            Homico Premium
          </p>
          <h1 className="text-[28px] font-light leading-[1.1] tracking-[-0.02em] text-[var(--hm-fg-primary)] sm:text-[32px]">
            {pick({ en: "Confirm your plan", ka: "დაადასტურე გეგმა" })}
          </h1>

          {/* Order summary */}
          <div className="mt-8 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-7">
            <div className="flex items-baseline justify-between">
              <span className="text-[17px] font-medium text-[var(--hm-fg-primary)]">
                {pick({ en: tier.name.en, ka: tier.name.ka })}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--hm-fg-subtle)]">
                {period === "monthly"
                  ? pick({ en: "monthly", ka: "თვიური" })
                  : pick({ en: "yearly", ka: "წლიური" })}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              {promo && (
                <span className="text-[20px] font-light tabular-nums text-[var(--hm-fg-subtle)] line-through">
                  {currency}
                  {price}
                </span>
              )}
              <span className="text-[44px] font-light leading-none tabular-nums tracking-[-0.03em] text-[var(--hm-fg-primary)]">
                {currency}
                {effectivePrice}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--hm-fg-subtle)]">
                / {periodLabel}
              </span>
            </div>
            {period === "yearly" && yearlySaving > 0 && !promo && (
              <p className="mt-2 text-[12px] text-[var(--hm-fg-muted)]">
                {t("premium.saveAmount", { currency, amount: yearlySaving })}
              </p>
            )}

            <div className="my-6 h-px bg-[var(--hm-border-subtle)]" />

            <ul className="space-y-2.5">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hm-fg-subtle)]" strokeWidth={1.75} />
                  <span className="text-[13.5px] font-light leading-snug text-[var(--hm-fg-secondary)]">
                    {pick({ en: f.en, ka: f.ka })}
                  </span>
                </li>
              ))}
            </ul>

            <div className="my-6 h-px bg-[var(--hm-border-subtle)]" />

            {/* Promo code */}
            {promo ? (
              <div className="flex items-center justify-between rounded-xl border border-[var(--hm-success-500)]/30 bg-[var(--hm-success-500)]/[0.07] px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--hm-success-600)]">
                  <Check className="h-4 w-4" strokeWidth={2.25} />
                  {promo.code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPromo(null);
                    setPromoInput("");
                  }}
                  className="text-[12px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                >
                  {pick({ en: "Remove", ka: "მოშორება" })}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoErr("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    placeholder={pick({ en: "Promo code", ka: "პრომო კოდი" })}
                    className="h-10 flex-1 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] px-3 text-[14px] uppercase tracking-wide text-[var(--hm-fg-primary)] outline-none placeholder:tracking-normal placeholder:text-[var(--hm-fg-subtle)] focus:border-[var(--hm-brand-500)]"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={applyingPromo || !promoInput.trim()}
                    className="h-10 shrink-0 rounded-xl border border-[var(--hm-border-strong)] px-4 text-[13px] font-medium text-[var(--hm-fg-primary)] transition-colors hover:bg-[var(--hm-bg-tertiary)] disabled:opacity-50"
                  >
                    {applyingPromo ? <LoadingSpinner size="sm" /> : pick({ en: "Apply", ka: "გამოყენება" })}
                  </button>
                </div>
                {promoErr && (
                  <p className="mt-2 text-[12px] text-[var(--hm-error-500)]">{promoErr}</p>
                )}
              </div>
            )}

            <div className="my-6 h-px bg-[var(--hm-border-subtle)]" />

            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-light text-[var(--hm-fg-muted)]">
                {pick({ en: "Total today", ka: "ჯამი" })}
              </span>
              <span className="text-[20px] font-light tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
                {currency}
                {effectivePrice}
              </span>
            </div>
          </div>

          {/* Pay */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--hm-fg-primary)] text-[14px] font-medium text-[var(--hm-bg-elevated)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isProcessing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                {pick({ en: "Pay securely", ka: "უსაფრთხო გადახდა" })}
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-3">
            <p className="flex items-center gap-1.5 text-[12px] font-light text-[var(--hm-fg-muted)]">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
              {pick({ en: "Secure payment", ka: "უსაფრთხო გადახდა" })}
            </p>
            <PaymentMarks />
          </div>
          <p className="mt-2.5 text-center text-[12px] font-light text-[var(--hm-fg-muted)]">
            {pick({
              en: "You'll be redirected to our secure payment partner. 3-day money-back guarantee.",
              ka: "გადახვალთ უსაფრთხო გადახდის გვერდზე. 3 დღიანი თანხის დაბრუნება.",
            })}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard allowedRoles={["pro", "admin"]}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[var(--hm-bg-page)]">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </AuthGuard>
  );
}
