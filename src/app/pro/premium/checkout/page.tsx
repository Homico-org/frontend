"use client";

import AuthGuard from "@/components/common/AuthGuard";
import Header, { HeaderSpacer } from "@/components/common/Header";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import PaymentMarks from "@/components/common/PaymentMarks";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { features } from "@/config/features";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { ArrowLeft, ArrowUpRight, Check, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const PREMIUM_TIERS: Record<
  string,
  {
    id: string;
    name: { en: string; ka: string };
    price: { monthly: number; yearly: number };
    features: { en: string; ka: string }[];
  }
> = {
  basic: {
    id: "basic",
    name: { en: "Premium", ka: "პრემიუმ" },
    price: { monthly: 29, yearly: 290 },
    features: [
      { en: "Premium badge", ka: "პრემიუმ ბეჯი" },
      { en: "Priority in search", ka: "პრიორიტეტი ძიებაში" },
      { en: "2x more profile views", ka: "2x მეტი ნახვა" },
      { en: "Profile analytics", ka: "პროფილის ანალიტიკა" },
    ],
  },
  pro: {
    id: "pro",
    name: { en: "Pro", ka: "პრო" },
    price: { monthly: 59, yearly: 590 },
    features: [
      { en: "Top of search results", ka: "ძიების პირველ ადგილზე" },
      { en: "Featured on the homepage", ka: "მთავარ გვერდზე გამოჩენა" },
      { en: "5x more profile views", ka: "5x მეტი ნახვა" },
      { en: "Priority support", ka: "პრიორიტეტული მხარდაჭერა" },
    ],
  },
  elite: {
    id: "elite",
    name: { en: "Elite", ka: "ელიტა" },
    price: { monthly: 99, yearly: 990 },
    features: [
      { en: "#1 search priority", ka: "#1 ძიების პრიორიტეტი" },
      { en: "Exclusive homepage spotlight", ka: "ექსკლუზიური ადგილი მთავარზე" },
      { en: "10x more profile views", ka: "10x მეტი ნახვა" },
      { en: "Personal manager", ka: "პერსონალური მენეჯერი" },
    ],
  },
};

function CheckoutContent() {
  const { t, pick } = useLanguage();
  const { error: toastError } = useToast();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!features.premium) router.replace("/pro/premium");
  }, [router]);

  const tierId = searchParams.get("tier") || "pro";
  const period = (searchParams.get("period") || "monthly") as "monthly" | "yearly";

  const tier = PREMIUM_TIERS[tierId];
  const price = tier ? tier.price[period] : 0;
  const currency = "₾";
  const yearlySaving = tier ? tier.price.monthly * 12 - tier.price.yearly : 0;

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      trackEvent(AnalyticsEvent.PREMIUM_PURCHASE, { planType: tierId, planPrice: price });
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/payments/premium/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier: tierId, period }),
      });
      if (!res.ok) throw new Error(`Premium checkout failed (${res.status})`);
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
            onClick={() => router.push("/pro/premium")}
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

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[44px] font-light leading-none tabular-nums tracking-[-0.03em] text-[var(--hm-fg-primary)]">
                {currency}
                {price}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--hm-fg-subtle)]">
                / {periodLabel}
              </span>
            </div>
            {period === "yearly" && yearlySaving > 0 && (
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

            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-light text-[var(--hm-fg-muted)]">
                {pick({ en: "Total today", ka: "ჯამი" })}
              </span>
              <span className="text-[20px] font-light tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
                {currency}
                {price}
              </span>
            </div>
          </div>

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
              en: "You'll be redirected to our secure payment partner. 7-day money-back guarantee.",
              ka: "გადახვალთ უსაფრთხო გადახდის გვერდზე. 7 დღიანი თანხის დაბრუნება.",
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
