"use client";
import { ACCENT_COLOR } from "@/constants/theme";

import Header, { HeaderSpacer } from "@/components/common/Header";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCountry, useCountryLink } from "@/hooks/useCountry";
import { getPremiumTierPrices, type PremiumTierId } from "@/data/premium-pricing";
import { currencySymbol } from "@/utils/currency";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  Gem,
  Headphones,
  MessageCircle,
  Palette,
  Shield,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Luxurious color palette
const COLORS = {
  gold: "#D4AF37",
  goldLight: "#E8C547",
  goldDark: "#B8962F",
  terracotta: ACCENT_COLOR,
  terracottaLight: "#F06B43",
  terracottaDark: "#A92B08",
  cream: "#FFFBF5",
  champagne: "#F7E7CE",
  charcoal: "#1A1A1A",
  platinum: "#E5E4E2",
};

// Premium tier configuration. Price + currency are intentionally NOT
// part of this static config any more (2026-05) - they're looked up
// per marketplace at render time from `data/premium-pricing.ts`.
interface PremiumTier {
  id: PremiumTierId;
  name: { en: string; ka: string };
  tagline: { en: string; ka: string };
  icon: React.ElementType;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  features: {
    icon: React.ElementType;
    text: { en: string; ka: string };
    included?: boolean;
  }[];
  popular: boolean;
  highlightKey?: string;
}

const PREMIUM_TIERS: Record<string, PremiumTier> = {
  basic: {
    id: "basic",
    name: { en: "Premium", ka: "პრემიუმ" },
    tagline: { en: "Stand out from the crowd", ka: "გამოირჩიე სხვებისგან" },
    icon: Star,
    accentColor: "#4A9B9B",
    gradientFrom: "#4A9B9B",
    gradientTo: "#3D8585",
    glowColor: "rgba(74, 155, 155, 0.3)",
    features: [
      { icon: BadgeCheck, text: { en: "Premium Badge", ka: "პრემიუმ ბეჯი" } },
      { icon: TrendingUp, text: { en: "Priority Search", ka: "პრიორიტეტული ძიება" } },
      { icon: Eye, text: { en: "2x Profile Views", ka: "2x მეტი ნახვა" } },
      { icon: MessageCircle, text: { en: "Direct Messaging", ka: "პირდაპირი შეტყობინებები" } },
      { icon: Clock, text: { en: "Analytics", ka: "ანალიტიკა" } },
    ],
    popular: false,
  },
  pro: {
    id: "pro",
    name: { en: "Pro", ka: "პრო" },
    tagline: { en: "For serious professionals", ka: "სერიოზული პროფესიონალებისთვის" },
    icon: Zap,
    accentColor: COLORS.terracotta,
    gradientFrom: COLORS.terracotta,
    gradientTo: COLORS.terracottaDark,
    glowColor: "rgba(239, 78, 36, 0.35)",
    highlightKey: "premium.mostPopular",
    features: [
      { icon: BadgeCheck, text: { en: "Everything in Premium", ka: "ყველაფერი პრემიუმიდან" }, included: true },
      { icon: Crown, text: { en: "Pro Badge", ka: "პრო ბეჯი" } },
      { icon: TrendingUp, text: { en: "Top Placement", ka: "ტოპ პოზიცია" } },
      { icon: Eye, text: { en: "5x Profile Views", ka: "5x მეტი ნახვა" } },
      { icon: Star, text: { en: "Homepage Feature", ka: "მთავარ გვერდზე" } },
      { icon: Shield, text: { en: "Priority Support", ka: "პრიორიტეტული მხარდაჭერა" } },
      { icon: Award, text: { en: "Unlimited Portfolio", ka: "შეუზღუდავი პორტფოლიო" } },
    ],
    popular: true,
  },
  elite: {
    id: "elite",
    name: { en: "Elite", ka: "ელიტა" },
    tagline: { en: "The ultimate experience", ka: "უმაღლესი გამოცდილება" },
    icon: Gem,
    accentColor: COLORS.gold,
    gradientFrom: COLORS.gold,
    gradientTo: COLORS.goldDark,
    glowColor: "rgba(212, 175, 55, 0.4)",
    features: [
      { icon: BadgeCheck, text: { en: "Everything in Pro", ka: "ყველაფერი პრო-დან" }, included: true },
      { icon: Crown, text: { en: "Elite Gold Badge", ka: "ელიტა ოქროს ბეჯი" } },
      { icon: TrendingUp, text: { en: "#1 Search Priority", ka: "#1 ძიების პრიორიტეტი" } },
      { icon: Eye, text: { en: "10x Profile Views", ka: "10x მეტი ნახვა" } },
      { icon: Award, text: { en: "Exclusive Spotlight", ka: "ექსკლუზიური სპოტლაითი" } },
      { icon: Headphones, text: { en: "Personal Manager", ka: "პერსონალური მენეჯერი" } },
      { icon: MessageCircle, text: { en: "WhatsApp Support", ka: "WhatsApp მხარდაჭერა" } },
      { icon: Palette, text: { en: "Custom Portfolio", ka: "პერსონალური პორტფოლიო" } },
    ],
    popular: false,
  },
};

type BillingPeriod = "monthly" | "yearly";

// Animated Sparkle Component

// Premium Card Component
function PremiumCard({
  tier,
  isSelected,
  billingPeriod,
  currentTier,
  onSelect,
  onChoose,
  index,
}: {
  tier: PremiumTier;
  isSelected: boolean;
  billingPeriod: BillingPeriod;
  currentTier: string;
  onSelect: () => void;
  onChoose: () => void;
  index: number;
}) {
  const { t, pick } = useLanguage();
  const country = useCountry();
  const TierIcon = tier.icon;
  // Price + currency resolved from the active marketplace (added 2026-05).
  // Israeli pros see shekel pricing, US pros see USD, etc.
  const tierPrices = getPremiumTierPrices(country, tier.id);
  const price = tierPrices[billingPeriod];
  const currency = currencySymbol({ country });
  const isCurrent = currentTier === tier.id;

  return (
    <div
      onClick={onSelect}
      style={{ animationDelay: `${index * 80}ms` }}
      className={`animate-card-enter relative flex h-full cursor-pointer flex-col rounded-2xl bg-[var(--hm-bg-elevated)] p-7 transition-all duration-300 ${
        tier.popular
          ? "border-2 border-[var(--hm-brand-500)] shadow-[0_24px_60px_-32px_rgba(239,78,36,0.45)] md:-mt-4"
          : "border border-[var(--hm-border-subtle)] hover:border-[var(--hm-border-strong)]"
      } ${isSelected && !tier.popular ? "ring-1 ring-[var(--hm-brand-500)]/25" : ""}`}
    >
      {/* Popular pill - the one vermillion moment */}
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--hm-brand-500)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
          {tier.highlightKey ? t(tier.highlightKey) : ""}
        </span>
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <TierIcon
          className="h-[18px] w-[18px]"
          style={{ color: tier.popular ? "var(--hm-brand-500)" : "var(--hm-fg-muted)" }}
        />
        <h3 className="text-[19px] font-bold tracking-[-0.01em] text-[var(--hm-fg-primary)]">
          {pick({ en: tier.name.en, ka: tier.name.ka })}
        </h3>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--hm-fg-muted)]">
        {pick({ en: tier.tagline.en, ka: tier.tagline.ka })}
      </p>

      {/* Price */}
      <div className="mt-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[42px] font-bold leading-none tabular-nums tracking-[-0.03em] text-[var(--hm-fg-primary)]">
            {currency}
            {price}
          </span>
          <span className="text-[14px] text-[var(--hm-fg-muted)]">
            /{billingPeriod === "monthly" ? t("premium.mo") : t("premium.yr")}
          </span>
        </div>
        {billingPeriod === "yearly" && (
          <p className="mt-2 text-[12px] font-semibold text-[var(--hm-success-600)]">
            {t("premium.saveAmount", {
              currency,
              amount: tierPrices.monthly * 12 - tierPrices.yearly,
            })}
          </p>
        )}
      </div>

      <div className="my-6 h-px bg-[var(--hm-border-subtle)]" />

      {/* Features */}
      <ul className="flex-1 space-y-3">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{
                color: feature.included
                  ? "var(--hm-fg-subtle)"
                  : "var(--hm-brand-500)",
              }}
            />
            <span
              className={`text-[13.5px] leading-snug ${
                feature.included
                  ? "text-[var(--hm-fg-muted)]"
                  : "text-[var(--hm-fg-secondary)]"
              }`}
            >
              {pick({ en: feature.text.en, ka: feature.text.ka })}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChoose();
        }}
        disabled={isCurrent}
        className={`mt-7 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold transition-colors ${
          isCurrent
            ? "cursor-not-allowed bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]"
            : tier.popular
              ? "bg-[var(--hm-brand-500)] text-white hover:bg-[var(--hm-brand-600)]"
              : "border border-[var(--hm-border-strong)] text-[var(--hm-fg-primary)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)]"
        }`}
      >
        {isCurrent ? (
          t("premium.currentPlan")
        ) : (
          <>
            {t("premium.getStarted")}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

// Testimonial Component - editorial quote card (trust comes from the words)
function TestimonialCard({
  name,
  role,
  text,
  avatar,
  index,
}: {
  name: string;
  role: string;
  text: string;
  avatar: string;
  index: number;
}) {
  return (
    <figure
      className="animate-card-enter flex h-full flex-col rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-24px_rgba(17,16,13,0.22)]"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span
        aria-hidden
        className="font-serif text-[52px] leading-[0.6] text-[var(--hm-brand-500)]/25"
      >
        &ldquo;
      </span>
      <blockquote className="mt-3 flex-1 text-[16px] italic leading-relaxed text-[var(--hm-fg-primary)]">
        {text}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--hm-border-subtle)] pt-5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ background: "var(--hm-brand-500)" }}
        >
          {avatar}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-[var(--hm-fg-primary)]">
            {name}
          </span>
          <span className="block truncate text-[12px] text-[var(--hm-fg-muted)]">
            {role}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

// FAQ Component
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
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left group"
      >
        <span className="font-medium text-[var(--hm-fg-primary)] group-hover:text-[var(--hm-fg-secondary)] transition-colors">
          {question}
        </span>
        <div 
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ background: isOpen ? `${COLORS.terracotta}15` : "#F3F4F6" }}
        >
          <ChevronDown
            className="w-4 h-4"
            style={{ color: isOpen ? COLORS.terracotta : "#9CA3AF" }}
          />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48 pb-6" : "max-h-0"}`}>
        <p className="text-[var(--hm-fg-muted)] leading-relaxed">{answer}</p>
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
  const [selectedTier, setSelectedTier] = useState<string>("pro");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [testimonialsVisible, setTestimonialsVisible] = useState(false);

  const isPro = user?.role === "pro";
  const currentTier = user && 'proProfile' in user ? (user as { proProfile?: { premiumTier?: string } }).proProfile?.premiumTier || "none" : "none";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    trackEvent(AnalyticsEvent.PREMIUM_VIEW);
  }, [trackEvent]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTestimonialsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (testimonialsRef.current) observer.observe(testimonialsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSelectPlan = (tierId: string) => {
    if (!isAuthenticated) {
      router.push("/register?redirect=/pro/premium");
      return;
    }
    if (!isPro) {
      // /register stays country-agnostic (auth). /become-pro and
      // /pro/premium are country-scoped, so we resolve them through
      // the marketplace-aware link helper.
      router.push(cl(`/become-pro?redirect=${encodeURIComponent(cl('/pro/premium'))}`));
      return;
    }
    trackEvent(AnalyticsEvent.PREMIUM_CHECKOUT_START, {
      planType: tierId,
      planPrice: getPremiumTierPrices(country, tierId as PremiumTierId)[billingPeriod],
    });
    router.push(cl(`/pro/premium/checkout?tier=${tierId}&period=${billingPeriod}`));
  };

  const testimonials = [
    {
      name: t('premium.giorgiMeladze'),
      role: t('premium.interiorDesigner'),
      text: t('premium.eliteCompletelyTransformedMyBusiness'),
      rating: 5,
      avatar: "გმ",
      tier: "elite",
    },
    {
      name: t('premium.ninoTsereteli'),
      role: t('premium.architect'),
      text: t('premium.proPlanIsTheBest'),
      rating: 5,
      avatar: "ნწ",
      tier: "pro",
    },
    {
      name: t('premium.davidChkheidze'),
      role: t('premium.builder'),
      text: t('premium.prioritySearchReallyWorksIm'),
      rating: 5,
      avatar: "დჩ",
      tier: "premium",
    },
  ];

  const faqs = [
    {
      q: { en: "Can I upgrade or downgrade my plan?", ka: "შემიძლია გეგმის შეცვლა?" },
      a: { en: "Yes! You can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated difference.", ka: "დიახ! შეგიძლია გეგმის შეცვლა ნებისმიერ დროს." },
    },
    {
      q: { en: "What payment methods do you accept?", ka: "რა გადახდის მეთოდებს იღებთ?" },
      a: { en: "We accept all major credit/debit cards, Bank of Georgia, TBC Bank, and Liberty Bank transfers.", ka: "ვიღებთ ყველა ძირითად ბარათს და საბანკო გადარიცხვებს." },
    },
    {
      q: { en: "How does the 7-day guarantee work?", ka: "როგორ მუშაობს 7 დღიანი გარანტია?" },
      a: { en: "If you're not satisfied within the first 7 days, contact us for a full refund. No questions asked.", ka: "თუ პირველი 7 დღის განმავლობაში არ ხარ კმაყოფილი, დაგიბრუნებთ 100%-ს." },
    },
    {
      q: { en: "What happens when my subscription ends?", ka: "რა ხდება როცა გამოწერა მთავრდება?" },
      a: { en: "Your profile reverts to the free tier. All your data and portfolio remain intact.", ka: "შენი პროფილი უფასო ვერსიაზე გადაიტანება. მონაცემები და პორტფოლიო შენარჩუნებულია." },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(10deg); opacity: 0.6; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <Header />
      <HeaderSpacer />

      <main className={`relative transition-all duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        
        {/* ========== HERO SECTION ========== */}
        <section className="relative overflow-hidden pt-14 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">

            {/* Trust badge */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-3 rounded-full border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-4 py-2 shadow-sm">
                <div className="flex -space-x-2">
                  {["NM", "GT", "DK", "LS"].map((initials, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--hm-bg-elevated)] text-[10px] font-bold text-white"
                      style={{
                        background: "var(--hm-brand-500)",
                        opacity: 1 - i * 0.12,
                        zIndex: 4 - i,
                      }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-[13px]">
                  <span className="font-bold text-[var(--hm-fg-primary)]">500+</span>{" "}
                  <span className="text-[var(--hm-fg-muted)]">{t('premium.professionalsTrustUs')}</span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--hm-fg-muted)]">
                Homico Premium
              </p>
              <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.05] tracking-[-0.035em] text-[var(--hm-fg-primary)]">
                {t('premium.headlinePrefix')}{" "}
                <span className="italic text-[var(--hm-brand-500)]">
                  {t('premium.headlineHighlight')}
                </span>
              </h1>
              <p className="mt-5 text-[16px] sm:text-[18px] text-[var(--hm-fg-muted)] max-w-xl mx-auto leading-relaxed">
                {t('premium.joinEliteProfessionalsAndUnlock')}
              </p>
            </div>

            {/* Billing toggle - clean segmented */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="inline-flex items-center rounded-full bg-[var(--hm-bg-tertiary)] p-1">
                {(["monthly", "yearly"] as BillingPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setBillingPeriod(period)}
                    className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${
                      billingPeriod === period
                        ? "bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-[0_1px_2px_rgba(17,16,13,0.06)]"
                        : "text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
                    }`}
                  >
                    {period === "monthly" ? t('premium.monthly') : t('premium.yearly')}
                  </button>
                ))}
              </div>
              <span className="rounded-full bg-[var(--hm-success-500)]/[0.12] px-2.5 py-1 text-[12px] font-semibold text-[var(--hm-success-600)]">
                -17%
              </span>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto items-stretch pt-4">
              {Object.values(PREMIUM_TIERS).map((tier, index) => (
                <PremiumCard
                  key={tier.id}
                  tier={tier}
                  isSelected={selectedTier === tier.id}
                  billingPeriod={billingPeriod}
                  currentTier={currentTier}
                  onSelect={() => setSelectedTier(tier.id)}
                  onChoose={() => handleSelectPlan(tier.id)}
                  index={index}
                />
              ))}
            </div>

            {/* Guarantee */}
            <div className="flex justify-center mt-10">
              <span className="inline-flex items-center gap-2 text-[13px] text-[var(--hm-fg-muted)]">
                <Shield className="w-4 h-4 text-[var(--hm-success-500)]" />
                {t('premium.7dayMoneybackGuaranteeNoQuestions')}
              </span>
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS SECTION ========== */}
        <section 
          ref={testimonialsRef}
          className="py-24 bg-[var(--hm-bg-page)]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--hm-fg-muted)]">
                {t('premium.realResults')}
              </p>
              <h2 className="text-[32px] sm:text-[40px] font-bold leading-tight tracking-[-0.03em] text-[var(--hm-fg-primary)]">
                {t('premium.whatOurMembersSay')}
              </h2>
              <p className="mt-3 max-w-xl mx-auto text-[15px] text-[var(--hm-fg-muted)]">
                {t('premium.joinHundredsOfSuccessfulProfessionals')}
              </p>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 ${
              testimonialsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              {testimonials.map((testimonial, i) => (
                <TestimonialCard key={i} {...testimonial} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ========== STATS SECTION ========== */}
        <section className="border-y border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-[var(--hm-border-subtle)]">
              {[
                { value: "7", label: t('premium.dayGuarantee') },
                { value: "500+", label: t('premium.eliteMembers') },
                { value: "4.9", label: t('premium.avgRating') },
                { value: "10x", label: t('premium.moreViews') },
              ].map((stat, i) => (
                <div key={i} className="px-2 text-center">
                  <p className="text-[44px] font-bold leading-none tabular-nums tracking-[-0.04em] text-[var(--hm-fg-primary)] sm:text-[52px]">
                    {stat.value}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--hm-fg-muted)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FAQ SECTION ========== */}
        <section className="py-24 bg-[var(--hm-bg-page)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--hm-fg-muted)]">
                FAQ
              </p>
              <h2 className="text-[28px] sm:text-[34px] font-bold leading-tight tracking-[-0.03em] text-[var(--hm-fg-primary)]">
                {t('premium.frequentlyAskedQuestions')}
              </h2>
            </div>

            <div className="rounded-2xl bg-[var(--hm-bg-elevated)] p-8 border border-[var(--hm-border-subtle)] shadow-sm">
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

        {/* ========== FINAL CTA - one bold vermillion fold ========== */}
        <section
          className="relative overflow-hidden py-24"
          style={{ background: "var(--hm-brand-500)" }}
        >
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70">
              {t('premium.becomeEliteToday')}
            </p>
            <h2 className="text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-[46px]">
              {t('premium.readyForSuccess')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/85">
              {t('premium.joinTheBestProfessionalsAnd')}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => handleSelectPlan("pro")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-[14px] font-semibold text-[var(--hm-brand-500)] transition-colors hover:bg-white/90"
              >
                {t('premium.proPlan')}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleSelectPlan("elite")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/40 px-7 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('premium.chooseElite')}
              </button>
            </div>

            <p className="mt-8 inline-flex items-center justify-center gap-2 text-[13px] text-white/70">
              <Shield className="h-4 w-4" />
              {t('premium.7dayMoneybackGuarantee')}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
