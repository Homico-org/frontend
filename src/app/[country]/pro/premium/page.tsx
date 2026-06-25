"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCountry, useCountryLink } from "@/hooks/useCountry";
import { getPremiumTierPrices, type PremiumTierId } from "@/data/premium-pricing";
import { currencySymbol } from "@/utils/currency";
import { features } from "@/config/features";
import { ArrowUpRight, Check, ChevronDown, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Real, current platform figures (queried 2026-06 from prod). Keep honest.
const VERIFIED_PROS = "650+";
const AVG_RATING = "4.9";

interface PremiumTier {
  id: PremiumTierId;
  name: { en: string; ka: string };
  tagline: { en: string; ka: string };
  features: { text: { en: string; ka: string }; included?: boolean }[];
  popular: boolean;
  highlightKey?: string;
}

const PREMIUM_TIERS: Record<string, PremiumTier> = {
  basic: {
    id: "basic",
    name: { en: "Premium", ka: "პრემიუმ" },
    tagline: { en: "Get noticed", ka: "გამოჩნდი" },
    features: [
      { text: { en: "Premium badge", ka: "პრემიუმ ბეჯი" } },
      { text: { en: "Priority in search", ka: "პრიორიტეტი ძიებაში" } },
      { text: { en: "2x more profile views", ka: "2x მეტი ნახვა" } },
      { text: { en: "Direct messaging", ka: "პირდაპირი მიმოწერა" } },
      { text: { en: "Profile analytics", ka: "პროფილის ანალიტიკა" } },
    ],
    popular: false,
  },
  pro: {
    id: "pro",
    name: { en: "Pro", ka: "პრო" },
    tagline: { en: "Win more jobs", ka: "მიიღე მეტი შეკვეთა" },
    highlightKey: "premium.mostPopular",
    features: [
      { text: { en: "Everything in Premium", ka: "ყველაფერი პრემიუმიდან" }, included: true },
      { text: { en: "Top of search results", ka: "ძიების პირველ ადგილზე" } },
      { text: { en: "Featured on the homepage", ka: "მთავარ გვერდზე გამოჩენა" } },
      { text: { en: "5x more profile views", ka: "5x მეტი ნახვა" } },
      { text: { en: "Pro badge", ka: "პრო ბეჯი" } },
      { text: { en: "Priority support", ka: "პრიორიტეტული მხარდაჭერა" } },
      { text: { en: "Unlimited portfolio", ka: "შეუზღუდავი პორტფოლიო" } },
    ],
    popular: true,
  },
  elite: {
    id: "elite",
    name: { en: "Elite", ka: "ელიტა" },
    tagline: { en: "Own your category", ka: "იყავი №1" },
    features: [
      { text: { en: "Everything in Pro", ka: "ყველაფერი პრო-დან" }, included: true },
      { text: { en: "#1 search priority", ka: "#1 ძიების პრიორიტეტი" } },
      { text: { en: "Exclusive homepage spotlight", ka: "ექსკლუზიური ადგილი მთავარზე" } },
      { text: { en: "10x more profile views", ka: "10x მეტი ნახვა" } },
      { text: { en: "Elite badge", ka: "ელიტა ბეჯი" } },
      { text: { en: "Personal manager", ka: "პერსონალური მენეჯერი" } },
      { text: { en: "WhatsApp support", ka: "WhatsApp მხარდაჭერა" } },
    ],
    popular: false,
  },
};

type BillingPeriod = "monthly" | "yearly";

// ── "You're #1 in search" - monochrome, quiet ─────────────────────────────
function SearchRankVisual() {
  const { pick } = useLanguage();
  return (
    <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-6">
      <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--hm-fg-subtle)]">
        {pick({ en: "Search results", ka: "ძიების შედეგი" })}
      </div>

      {/* You - #1 */}
      <div className="flex items-center gap-3 rounded-xl border border-[var(--hm-fg-primary)]/15 bg-[var(--hm-fg-primary)]/[0.03] p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hm-fg-primary)] text-[12px] font-medium text-[var(--hm-bg-elevated)]">
          {pick({ en: "You", ka: "შენ" })}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
              {pick({ en: "Your profile", ka: "შენი პროფილი" })}
            </span>
            <span className="rounded border border-[var(--hm-fg-primary)]/30 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-[var(--hm-fg-secondary)]">
              Premium
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--hm-fg-muted)]">
            <Star className="h-3 w-3 fill-[var(--hm-fg-primary)] text-[var(--hm-fg-primary)]" />
            4.9 · {pick({ en: "top match", ka: "საუკეთესო შედეგი" })}
          </div>
        </div>
        <span className="font-mono text-[16px] font-medium text-[var(--hm-fg-primary)]">#1</span>
      </div>

      {/* Others */}
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
        {pick({ en: "Premium keeps you on top", ka: "Premium გამოგაჩენს თავში" })}
      </p>
    </div>
  );
}

// ── Pricing card - recommended is a solid BLACK card. No color. ────────────
function PremiumCard({
  tier,
  billingPeriod,
  currentTier,
  onChoose,
}: {
  tier: PremiumTier;
  billingPeriod: BillingPeriod;
  currentTier: string;
  onChoose: () => void;
}) {
  const { t, pick } = useLanguage();
  const country = useCountry();
  const tierPrices = getPremiumTierPrices(country, tier.id);
  const price = tierPrices[billingPeriod];
  const currency = currencySymbol({ country });
  const isCurrent = currentTier === tier.id;
  const dark = tier.popular;

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl p-8 transition-colors duration-200 ${
        dark
          ? "bg-[var(--hm-fg-primary)]"
          : "border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] hover:border-[var(--hm-border-strong)]"
      }`}
    >
      {dark && tier.highlightKey && (
        <span className="absolute -top-2.5 left-8 rounded-full bg-[var(--hm-bg-elevated)] px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--hm-fg-primary)]">
          {t(tier.highlightKey)}
        </span>
      )}

      <h3 className={`text-[18px] font-medium tracking-[-0.01em] ${dark ? "text-[var(--hm-bg-elevated)]" : "text-[var(--hm-fg-primary)]"}`}>
        {pick({ en: tier.name.en, ka: tier.name.ka })}
      </h3>
      <p className={`mt-2 text-[13px] ${dark ? "text-white/55" : "text-[var(--hm-fg-muted)]"}`}>
        {pick({ en: tier.tagline.en, ka: tier.tagline.ka })}
      </p>

      <div className="mt-8 flex items-baseline gap-1.5">
        <span className={`text-[44px] font-light leading-none tabular-nums tracking-[-0.03em] ${dark ? "text-[var(--hm-bg-elevated)]" : "text-[var(--hm-fg-primary)]"}`}>
          {currency}
          {price}
        </span>
        <span className={`font-mono text-[11px] uppercase tracking-[0.04em] ${dark ? "text-white/45" : "text-[var(--hm-fg-subtle)]"}`}>
          / {billingPeriod === "monthly" ? t("premium.mo") : t("premium.yr")}
        </span>
      </div>
      {billingPeriod === "yearly" && (
        <p className={`mt-2.5 text-[12px] ${dark ? "text-white/55" : "text-[var(--hm-fg-muted)]"}`}>
          {t("premium.saveAmount", {
            currency,
            amount: tierPrices.monthly * 12 - tierPrices.yearly,
          })}
        </p>
      )}

      <div className={`my-7 h-px ${dark ? "bg-white/12" : "bg-[var(--hm-border-subtle)]"}`} />

      <ul className="flex-1 space-y-3.5">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-white/40" : "text-[var(--hm-fg-subtle)]"}`} strokeWidth={1.75} />
            <span
              className={`text-[13.5px] leading-snug ${
                feature.included
                  ? dark
                    ? "font-medium text-[var(--hm-bg-elevated)]"
                    : "font-medium text-[var(--hm-fg-primary)]"
                  : dark
                    ? "text-white/80"
                    : "text-[var(--hm-fg-secondary)]"
              }`}
            >
              {pick({ en: feature.text.en, ka: feature.text.ka })}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onChoose}
        disabled={isCurrent}
        className={`mt-8 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[14px] font-medium transition-colors ${
          isCurrent
            ? "cursor-not-allowed bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]"
            : dark
              ? "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] hover:opacity-90"
              : "border border-[var(--hm-border-strong)] text-[var(--hm-fg-primary)] hover:border-[var(--hm-fg-primary)]"
        }`}
      >
        {isCurrent ? (
          t("premium.currentPlan")
        ) : (
          <>
            {t("premium.getStarted")}
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </>
        )}
      </button>
    </div>
  );
}

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--hm-border-subtle)] last:border-0">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 py-6 text-left">
        <span className="text-[15px] font-medium text-[var(--hm-fg-primary)]">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--hm-fg-muted)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48 pb-6" : "max-h-0"}`}>
        <p className="text-[14px] leading-relaxed text-[var(--hm-fg-muted)]">{answer}</p>
      </div>
    </div>
  );
}

export default function PremiumPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, pick } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const cl = useCountryLink();
  const country = useCountry();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const isPro = user?.role === "pro";
  const currentTier =
    user && "proProfile" in user
      ? (user as { proProfile?: { premiumTier?: string } }).proProfile?.premiumTier || "none"
      : "none";

  useEffect(() => {
    trackEvent(AnalyticsEvent.PREMIUM_VIEW);
  }, [trackEvent]);

  const handleSelectPlan = (tierId: string) => {
    if (!features.premium) return;
    if (!isAuthenticated) {
      router.push("/register?redirect=/pro/premium");
      return;
    }
    if (!isPro) {
      router.push(cl(`/become-pro?redirect=${encodeURIComponent(cl("/pro/premium"))}`));
      return;
    }
    trackEvent(AnalyticsEvent.PREMIUM_CHECKOUT_START, {
      planType: tierId,
      planPrice: getPremiumTierPrices(country, tierId as PremiumTierId)[billingPeriod],
    });
    router.push(cl(`/pro/premium/checkout?tier=${tierId}&period=${billingPeriod}`));
  };

  const scrollToPlans = () =>
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });

  const benefits = [
    {
      title: { en: "Top of search", ka: "ძიების თავში" },
      body: { en: "Clients see you before anyone else.", ka: "კლიენტი პირველ რიგში შენ გხედავს." },
    },
    {
      title: { en: "On the homepage", ka: "მთავარ გვერდზე" },
      body: { en: "A featured spot where demand starts.", ka: "გამორჩeული ადგილი, სადაც ძიება იწყება." },
    },
    {
      title: { en: "A badge that builds trust", ka: "ბეჯი, რომელიც ანდობს" },
      body: { en: "Stand out as a verified premium pro.", ka: "გამოირჩიე გადამოწმებული ბეჯით." },
    },
  ];

  const faqs = [
    {
      q: { en: "Will premium actually get me more clients?", ka: "მართლა მომიყვანს premium მეტ კლიენტს?" },
      a: {
        en: "Premium puts you at the top of search and on the homepage, where most clients pick. More visibility means more requests.",
        ka: "Premium გამოგაჩენს ძიების თავში და მთავარ გვერდზე, სადაც კლიენტების უმეტესობა ირჩევს. მეტი ხილვადობა მეტ მოთხოვნას ნიშნავს.",
      },
    },
    {
      q: { en: "Can I cancel anytime?", ka: "შემიძლია ნებისმიერ დროს გაუქმება?" },
      a: {
        en: "Yes. Your plan runs to the end of the paid period, then your profile simply returns to free. No lock-in.",
        ka: "დიახ. გეგმა მოქმედებს გადახდილი პერიოდის ბოლომდე, შემდეგ პროფილი უფასო ვერსიაზე ბრუნდება. ვალდებულების გარეშე.",
      },
    },
    {
      q: { en: "How does the 7-day guarantee work?", ka: "როგორ მუშაობს 7 დღიანი გარანტია?" },
      a: {
        en: "Not satisfied in the first 7 days? Contact us and we refund you in full.",
        ka: "არ ხარ კმაყოფილი პირველ 7 დღეში? დაგვიკავშირდი და თანხას სრულად დაგიბრუნებთ.",
      },
    },
    {
      q: { en: "What payment methods do you accept?", ka: "რა გადახდის მეთოდებს იღებთ?" },
      a: {
        en: "All major credit and debit cards, securely.",
        ka: "ყველა ძირითად ბარათს, უსაფრთხოდ.",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main>
        {/* ========== HERO ========== */}
        <section className="pt-32 pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-20 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hm-fg-subtle)]">
                  Homico Premium
                </p>
                <h1 className="text-[44px] font-light leading-[1.02] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[62px]">
                  {pick({ en: "Show up first,", ka: "გამოჩნდი პირველი," })}{" "}
                  <span className="italic">
                    {pick({ en: "win more jobs", ka: "მიიღე მეტი შეკვეთა" })}
                  </span>
                </h1>
                <p className="mt-8 max-w-md text-[16px] font-light leading-relaxed text-[var(--hm-fg-muted)] sm:text-[17px]">
                  {pick({
                    en: "Premium pros appear at the top of search, on the homepage, and with a standout badge - right where clients decide who to call.",
                    ka: "Premium ოსტატები ჩნდებიან ძიების თავში, მთავარ გვერდზე და გამორჩeული ბეჯით. იქ, სადაც კლიენტი ირჩევს.",
                  })}
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button
                    onClick={scrollToPlans}
                    className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[var(--hm-fg-primary)] px-7 text-[14px] font-medium text-[var(--hm-bg-elevated)] transition-opacity hover:opacity-90"
                  >
                    {pick({ en: "See plans", ka: "ნახე გეგმები" })}
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <span className="text-[13px] font-light text-[var(--hm-fg-muted)]">
                    {pick({ en: "7-day money-back guarantee", ka: "7 დღიანი თანხის დაბრუნება" })}
                  </span>
                </div>

                <div className="mt-12 flex items-center gap-10">
                  <div>
                    <p className="text-[26px] font-light tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
                      {VERIFIED_PROS}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
                      {pick({ en: "verified pros", ka: "გადამოწმებული ოსტატი" })}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-[26px] font-light tabular-nums tracking-[-0.02em] text-[var(--hm-fg-primary)]">
                      {AVG_RATING}
                      <Star className="h-4 w-4 fill-[var(--hm-fg-primary)] text-[var(--hm-fg-primary)]" />
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--hm-fg-subtle)]">
                      {pick({ en: "average rating", ka: "საშუალო შეფასება" })}
                    </p>
                  </div>
                </div>
              </div>

              <SearchRankVisual />
            </div>
          </div>
        </section>

        {/* ========== 3 benefits - text only, airy ========== */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 border-t border-[var(--hm-border-subtle)] pt-20 sm:grid-cols-3">
              {benefits.map((b, i) => (
                <div key={i}>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--hm-fg-subtle)]">
                    0{i + 1}
                  </p>
                  <h3 className="text-[17px] font-medium tracking-[-0.01em] text-[var(--hm-fg-primary)]">
                    {pick({ en: b.title.en, ka: b.title.ka })}
                  </h3>
                  <p className="mt-2 text-[14px] font-light leading-relaxed text-[var(--hm-fg-muted)]">
                    {pick({ en: b.body.en, ka: b.body.ka })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== PLANS ========== */}
        <section id="plans" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--hm-fg-subtle)]">
                  {pick({ en: "Plans", ka: "გეგმები" })}
                </p>
                <h2 className="text-[28px] font-light leading-tight tracking-[-0.02em] text-[var(--hm-fg-primary)] sm:text-[36px]">
                  {pick({ en: "Pick your visibility", ka: "აირჩიე შენი ხილვადობა" })}
                </h2>
                <p className="mt-3 text-[14px] font-light text-[var(--hm-fg-muted)]">
                  {pick({
                    en: "One extra client covers the whole year.",
                    ka: "ერთი დამატებითი კლიენტი ფარავს მთელ წელს.",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full bg-[var(--hm-bg-tertiary)] p-1">
                  {(["monthly", "yearly"] as BillingPeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setBillingPeriod(period)}
                      className={`rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
                        billingPeriod === period
                          ? "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)]"
                          : "text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                      }`}
                    >
                      {period === "monthly" ? t("premium.monthly") : t("premium.yearly")}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--hm-fg-subtle)]">
                  -17%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 lg:gap-6">
              {Object.values(PREMIUM_TIERS).map((tier) => (
                <PremiumCard
                  key={tier.id}
                  tier={tier}
                  billingPeriod={billingPeriod}
                  currentTier={currentTier}
                  onChoose={() => handleSelectPlan(tier.id)}
                />
              ))}
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-[var(--hm-border-subtle)] pt-12 text-[13px] font-light text-[var(--hm-fg-muted)]">
              <span>{pick({ en: "7-day money-back guarantee", ka: "7 დღიანი თანხის დაბრუნება" })}</span>
              <span>{pick({ en: "Cancel anytime", ka: "გააუქმე ნებისმიერ დროს" })}</span>
              <span>{pick({ en: `${AVG_RATING} from ${VERIFIED_PROS} verified pros`, ka: `${AVG_RATING}, ${VERIFIED_PROS} გადამოწმებული ოსტატი` })}</span>
            </div>
          </div>
        </section>

        {/* ========== FAQ ========== */}
        <section className="py-20 pb-32">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--hm-fg-subtle)]">
              FAQ
            </p>
            <h2 className="mb-8 text-[28px] font-light leading-tight tracking-[-0.02em] text-[var(--hm-fg-primary)] sm:text-[34px]">
              {t("premium.frequentlyAskedQuestions")}
            </h2>
            <div>
              {faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  question={pick({ en: faq.q.en, ka: faq.q.ka })}
                  answer={pick({ en: faq.a.en, ka: faq.a.ka })}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========== CLOSING - quiet ink fold ========== */}
        <section className="bg-[var(--hm-fg-primary)]">
          <div className="mx-auto max-w-5xl px-4 py-28 sm:px-6">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
              {pick({ en: "Start today", ka: "დაიწყე დღესვე" })}
            </p>
            <h2 className="max-w-2xl text-[36px] font-light leading-[1.04] tracking-[-0.03em] text-[var(--hm-bg-elevated)] sm:text-[54px]">
              {pick({ en: "Ready for more clients?", ka: "მზად ხარ მეტი კლიენტისთვის?" })}
            </h2>
            <p className="mt-5 max-w-xl text-[16px] font-light leading-relaxed text-white/65">
              {pick({ en: `Join ${VERIFIED_PROS} verified pros on Homico.`, ka: `შემოგვიერთდი ${VERIFIED_PROS} გადამოწმებულ ოსტატს Homico-ზე.` })}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button
                onClick={() => handleSelectPlan("pro")}
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[var(--hm-bg-elevated)] px-7 text-[14px] font-medium text-[var(--hm-fg-primary)] transition-opacity hover:opacity-90"
              >
                {t("premium.getStarted")}
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <span className="text-[13px] font-light text-white/55">
                {pick({ en: "7-day money-back guarantee", ka: "7 დღიანი გარანტია" })}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
