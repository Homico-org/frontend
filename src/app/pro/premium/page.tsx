"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  Gem,
  Headphones,
  MessageCircle,
  Palette,
  Shield,
  Sparkles,
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
  terracotta: "#C4735B",
  terracottaLight: "#D4897A",
  terracottaDark: "#A85D4A",
  cream: "#FFFBF5",
  champagne: "#F7E7CE",
  charcoal: "#1A1A1A",
  platinum: "#E5E4E2",
};

// Premium tier configuration
interface PremiumTier {
  id: string;
  name: { en: string; ka: string };
  tagline: { en: string; ka: string };
  price: { monthly: number; yearly: number };
  currency: string;
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
    price: { monthly: 29, yearly: 290 },
    currency: "₾",
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
    price: { monthly: 59, yearly: 590 },
    currency: "₾",
    icon: Zap,
    accentColor: COLORS.terracotta,
    gradientFrom: COLORS.terracotta,
    gradientTo: COLORS.terracottaDark,
    glowColor: "rgba(196, 115, 91, 0.35)",
    highlightKey: "premium.mostPopular",
    features: [
      { icon: BadgeCheck, text: { en: "Everything in Premium", ka: "ყველაფერი პრემიუმიდან" }, included: true },
      { icon: Crown, text: { en: "Pro Badge", ka: "პრო ბეჯი" } },
      { icon: TrendingUp, text: { en: "Top Placement", ka: "ტოპ პოზიცია" } },
      { icon: Eye, text: { en: "5x Profile Views", ka: "5x მეტი ნახვა" } },
      { icon: Sparkles, text: { en: "Homepage Feature", ka: "მთავარ გვერდზე" } },
      { icon: Shield, text: { en: "Priority Support", ka: "პრიორიტეტული მხარდაჭერა" } },
      { icon: Award, text: { en: "Unlimited Portfolio", ka: "შეუზღუდავი პორტფოლიო" } },
    ],
    popular: true,
  },
  elite: {
    id: "elite",
    name: { en: "Elite", ka: "ელიტა" },
    tagline: { en: "The ultimate experience", ka: "უმაღლესი გამოცდილება" },
    price: { monthly: 99, yearly: 990 },
    currency: "₾",
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
      { icon: Sparkles, text: { en: "Exclusive Spotlight", ka: "ექსკლუზიური სპოტლაითი" } },
      { icon: Headphones, text: { en: "Personal Manager", ka: "პერსონალური მენეჯერი" } },
      { icon: MessageCircle, text: { en: "WhatsApp Support", ka: "WhatsApp მხარდაჭერა" } },
      { icon: Palette, text: { en: "Custom Portfolio", ka: "პერსონალური პორტფოლიო" } },
    ],
    popular: false,
  },
};

type BillingPeriod = "monthly" | "yearly";

// Animated Sparkle Component
function AnimatedSparkles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        >
          <Sparkles 
            className="text-amber-400/20" 
            style={{ 
              width: `${8 + Math.random() * 12}px`,
              height: `${8 + Math.random() * 12}px`,
            }} 
          />
        </div>
      ))}
    </div>
  );
}

// Premium Card Component
function PremiumCard({
  tier,
  isSelected,
  billingPeriod,
  currentTier,
  locale,
  onSelect,
  onChoose,
  index,
}: {
  tier: PremiumTier;
  isSelected: boolean;
  billingPeriod: BillingPeriod;
  currentTier: string;
  locale: string;
  onSelect: () => void;
  onChoose: () => void;
  index: number;
}) {
  const { t } = useLanguage();
  const TierIcon = tier.icon;
  const isElite = tier.id === "elite";
  const price = tier.price[billingPeriod];
  const isCurrent = currentTier === tier.id;

  return (
    <div
      onClick={onSelect}
      className={`
        relative rounded-3xl cursor-pointer transition-all duration-500 group
        ${isSelected ? "scale-[1.03] z-10" : "hover:scale-[1.01]"}
      `}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Glow Effect */}
      <div
        className={`absolute -inset-1 rounded-3xl blur-xl transition-opacity duration-500 ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`}
        style={{ background: tier.glowColor }}
      />

      {/* Gradient Border */}
      <div
        className={`absolute inset-0 rounded-3xl p-px transition-opacity duration-300 ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})` }}
      >
        <div className="w-full h-full rounded-3xl bg-white dark:bg-neutral-950" />
      </div>

      {/* Card Content */}
      <div
        className={`relative rounded-3xl p-8 h-full overflow-hidden ${
          isSelected ? "" : "border border-neutral-200/50 dark:border-neutral-800"
        }`}
        style={{ background: "white" }}
      >
        {/* Shine Effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)",
            transform: "translateX(-100%)",
            animation: isSelected ? "none" : undefined,
          }}
        />

        {/* Elite special background */}
        {isElite && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div 
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10"
              style={{ background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 70%)` }}
            />
            <div 
              className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full opacity-10"
              style={{ background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 70%)` }}
            />
          </div>
        )}

        {/* Popular Badge */}
        {tier.popular && (
          <div className="absolute -top-px left-1/2 -translate-x-1/2">
            <div
              className="px-4 py-1.5 rounded-b-xl text-xs font-bold text-white tracking-wider flex items-center gap-1.5 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})` }}
            >
              <Sparkles className="w-3 h-3" />
              {tier.highlightKey ? t(tier.highlightKey) : ''}
            </div>
          </div>
        )}

        {/* Elite Crown */}
        {isElite && isSelected && (
          <div className="absolute top-4 right-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
              style={{ background: `linear-gradient(135deg, ${COLORS.gold}30, ${COLORS.goldDark}20)` }}
            >
              <Crown className="w-5 h-5" style={{ color: COLORS.gold }} />
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 mt-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${tier.gradientFrom}20, ${tier.gradientTo}10)`,
              boxShadow: isSelected ? `0 8px 32px ${tier.glowColor}` : "none",
            }}
          >
            <TierIcon className="w-7 h-7" style={{ color: tier.accentColor }} />
          </div>
          <h3 
            className="text-2xl font-bold text-neutral-900 mb-2"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {tier.name[locale === "ka" ? "ka" : "en"]}
          </h3>
          <p className="text-neutral-500 text-sm">
            {tier.tagline[locale === "ka" ? "ka" : "en"]}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span 
              className="text-5xl font-bold"
              style={{ 
                fontFamily: "var(--font-sans)",
                background: isElite 
                  ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`
                  : `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {tier.currency}{price}
            </span>
            <span className="text-neutral-400 text-lg">
              /{billingPeriod === "monthly" ? (t('premium.mo')) : (t('premium.yr'))}
            </span>
          </div>
          {billingPeriod === "yearly" && (
            <div 
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "#ECFDF5", color: "#059669" }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {locale === "ka" ? `დაზოგე ₾${tier.price.monthly * 12 - tier.price.yearly}` : `Save ₾${tier.price.monthly * 12 - tier.price.yearly}`}
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {tier.features.map((feature, i) => {
            const FeatureIcon = feature.icon;
            return (
              <li 
                key={i} 
                className={`flex items-center gap-3 transition-all duration-300 ${
                  feature.included ? "opacity-60" : ""
                }`}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ 
                    backgroundColor: feature.included ? "#F3F4F6" : `${tier.accentColor}15`,
                  }}
                >
                  {feature.included ? (
                    <Check className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <FeatureIcon className="w-3.5 h-3.5" style={{ color: tier.accentColor }} />
                  )}
                </div>
                <span className={`text-sm ${feature.included ? "text-neutral-400" : "text-neutral-700"}`}>
                  {feature.text[locale === "ka" ? "ka" : "en"]}
                </span>
              </li>
            );
          })}
        </ul>

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChoose();
          }}
          disabled={isCurrent}
          className={`
            relative w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 
            flex items-center justify-center gap-2 overflow-hidden group/btn
            ${isCurrent
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : isSelected
                ? "text-white shadow-xl hover:shadow-2xl"
                : "text-neutral-700 hover:shadow-lg"
            }
          `}
          style={{
            background: isSelected && !isCurrent
              ? `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`
              : isCurrent 
                ? undefined 
                : COLORS.platinum,
            boxShadow: isSelected && !isCurrent ? `0 8px 32px ${tier.glowColor}` : undefined,
          }}
        >
          {/* Button shine effect */}
          {isSelected && !isCurrent && (
            <div 
              className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
              }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {isCurrent ? (
              <>{t('premium.currentPlan')}</>
            ) : (
              <>
                {isElite && <Crown className="w-4 h-4" />}
                {t('premium.getStarted')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

// Testimonial Component
function TestimonialCard({ 
  name, 
  role, 
  text, 
  rating,
  avatar,
  tier,
  index,
}: { 
  name: string; 
  role: string; 
  text: string; 
  rating: number;
  avatar: string;
  tier: string;
  index: number;
}) {
  const tierColors: Record<string, { bg: string; text: string }> = {
    elite: { bg: `${COLORS.gold}20`, text: COLORS.goldDark },
    pro: { bg: `${COLORS.terracotta}20`, text: COLORS.terracottaDark },
    premium: { bg: "#4A9B9B20", text: "#3D8585" },
  };
  const colors = tierColors[tier] || tierColors.premium;

  return (
    <div 
      className="relative bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-500 group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Quote mark */}
      <div 
        className="absolute top-4 right-4 text-5xl font-serif opacity-10"
        style={{ color: COLORS.terracotta }}
      >
        &ldquo;
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.terracottaDark})` }}
        >
          {avatar}
        </div>
        <div>
          <h4 className="font-semibold text-neutral-900">{name}</h4>
          <p className="text-sm text-neutral-500">{role}</p>
        </div>
        <div 
          className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ background: colors.bg, color: colors.text }}
        >
          {tier}
        </div>
      </div>

      <p className="text-neutral-600 text-sm leading-relaxed mb-4">{text}</p>

      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} 
          />
        ))}
      </div>

      {/* Hover glow */}
      <div 
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.terracotta}20, transparent 50%, ${COLORS.gold}20)`,
        }}
      />
    </div>
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
    <div className="border-b border-neutral-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left group"
      >
        <span className="font-medium text-neutral-800 group-hover:text-neutral-600 transition-colors">
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
        <p className="text-neutral-500 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function PremiumPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const [selectedTier, setSelectedTier] = useState<string>("pro");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [testimonialsVisible, setTestimonialsVisible] = useState(false);

  const isPro = user?.role === "pro";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      router.push("/become-pro?redirect=/pro/premium");
      return;
    }
    trackEvent(AnalyticsEvent.PREMIUM_CHECKOUT_START, {
      planType: tierId,
      planPrice: PREMIUM_TIERS[tierId].price[billingPeriod],
    });
    router.push(`/pro/premium/checkout?tier=${tierId}&period=${billingPeriod}`);
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
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50/50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
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
        <section className="relative pt-16 pb-24 overflow-hidden">
          {/* Animated Background */}
          <AnimatedSparkles />
          
          {/* Gradient Orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div 
              className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[200px] opacity-30"
              style={{ background: `radial-gradient(circle, ${COLORS.terracotta}40 0%, transparent 70%)` }}
            />
            <div 
              className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
              style={{ background: `radial-gradient(circle, ${COLORS.gold}40 0%, transparent 70%)` }}
            />
          </div>

          {/* Decorative Lines */}
          <div 
            className="absolute top-1/4 left-0 right-0 h-px opacity-30"
            style={{ background: `linear-gradient(to right, transparent, ${COLORS.terracotta}40, transparent)` }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            
            {/* Trust Badge */}
            <div className="flex justify-center mb-10">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200/50 shadow-lg">
                <div className="flex -space-x-2">
                  {["NM", "GT", "DK", "LS"].map((initials, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-md"
                      style={{ 
                        background: i === 0 
                          ? `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})` 
                          : `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.terracottaDark})`,
                        zIndex: 4 - i,
                      }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold text-neutral-900">500+</span>{" "}
                  <span className="text-neutral-500">{t('premium.professionalsTrustUs')}</span>
                </div>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 leading-[1.1]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {locale === "ka" ? (
                  <>
                    გახადე შენი ბიზნესი{" "}
                    <span className="relative inline-block">
                      <span 
                        style={{ 
                          background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.terracotta})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        ლეგენდა
                      </span>
                      <div 
                        className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                        style={{ background: `linear-gradient(to right, ${COLORS.gold}, ${COLORS.terracotta})` }}
                      />
                    </span>
                  </>
                ) : (
                  <>
                    Make Your Business{" "}
                    <span className="relative inline-block">
                      <span 
                        style={{ 
                          background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.terracotta})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Legendary
                      </span>
                      <div 
                        className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                        style={{ background: `linear-gradient(to right, ${COLORS.gold}, ${COLORS.terracotta})` }}
                      />
                    </span>
                  </>
                )}
              </h1>
              <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                {t('premium.joinEliteProfessionalsAndUnlock')}
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-14">
              <div className="relative flex items-center gap-1 p-1.5 rounded-full bg-white border border-neutral-200 shadow-lg">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingPeriod === "monthly" ? "text-white" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {billingPeriod === "monthly" && (
                    <div
                      className="absolute inset-0 rounded-full shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.terracottaDark})` }}
                    />
                  )}
                  <span className="relative z-10">{t('premium.monthly')}</span>
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`relative px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingPeriod === "yearly" ? "text-white" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {billingPeriod === "yearly" && (
                    <div
                      className="absolute inset-0 rounded-full shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.terracottaDark})` }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {t('premium.yearly')}
                  </span>
                </button>
                {/* Save badge */}
                <div 
                  className="absolute -top-3 -right-2 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg animate-pulse"
                  style={{ background: `linear-gradient(135deg, #10B981, #059669)` }}
                >
                  -17%
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {Object.values(PREMIUM_TIERS).map((tier, index) => (
                <PremiumCard
                  key={tier.id}
                  tier={tier}
                  isSelected={selectedTier === tier.id}
                  billingPeriod={billingPeriod}
                  currentTier={currentTier}
                  locale={locale}
                  onSelect={() => setSelectedTier(tier.id)}
                  onChoose={() => handleSelectPlan(tier.id)}
                  index={index}
                />
              ))}
            </div>

            {/* Guarantee Badge */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-50 border border-emerald-100">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {t('premium.7dayMoneybackGuaranteeNoQuestions')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS SECTION ========== */}
        <section 
          ref={testimonialsRef}
          className="py-24 bg-gradient-to-b from-neutral-50 to-white"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <Badge variant="premium" size="sm" className="mb-4">
                <Star className="w-3.5 h-3.5" />
                {t('premium.realResults')}
              </Badge>
              <h2 
                className="text-4xl font-bold text-neutral-900 mb-4"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t('premium.whatOurMembersSay')}
              </h2>
              <p className="text-neutral-500 max-w-xl mx-auto">
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
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Shield, value: "7", label: t('premium.dayGuarantee'), color: "#10B981" },
                { icon: Crown, value: "500+", label: t('premium.eliteMembers'), color: COLORS.gold },
                { icon: Star, value: "4.9", label: t('premium.avgRating'), color: "#F59E0B" },
                { icon: TrendingUp, value: "10x", label: t('premium.moreViews'), color: COLORS.terracotta },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="relative text-center p-8 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden"
                >
                  {/* Hover glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at center, ${stat.color}10 0%, transparent 70%)` }}
                  />
                  
                  <div 
                    className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${stat.color}15` }}
                  >
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <p 
                    className="text-4xl font-bold text-neutral-900 mb-2"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-neutral-500 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FAQ SECTION ========== */}
        <section className="py-24 bg-neutral-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 
                className="text-3xl font-bold text-neutral-900 mb-4"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t('premium.frequentlyAskedQuestions')}
              </h2>
            </div>

            <div className="rounded-2xl bg-white p-8 border border-neutral-100 shadow-sm">
              {faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  question={faq.q[locale === "ka" ? "ka" : "en"]}
                  answer={faq.a[locale === "ka" ? "ka" : "en"]}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="py-24 relative overflow-hidden">
          {/* Background */}
          <div 
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.terracottaDark})` }}
          />
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              backgroundImage: `radial-gradient(circle at 20% 30%, ${COLORS.gold}60 0%, transparent 40%), 
                               radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
            }}
          />
          <AnimatedSparkles />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-8">
              <Gem className="w-4 h-4 text-white" />
              <span className="text-white/90 text-sm font-medium">
                {t('premium.becomeEliteToday')}
              </span>
            </div>

            <h2 
              className="text-4xl sm:text-5xl font-bold text-white mb-6"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {t('premium.readyForSuccess')}
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-10">
              {t('premium.joinTheBestProfessionalsAnd')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => handleSelectPlan("elite")}
                variant="secondary"
                size="lg"
                rightIcon={<Crown className="w-5 h-5" />}
                className="shadow-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {t('premium.chooseElite')}
              </Button>
              <Button
                onClick={() => handleSelectPlan("pro")}
                variant="ghost"
                size="lg"
                className="text-white border-white/30 hover:bg-white/10"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {t('premium.proPlan')}
              </Button>
            </div>

            {/* Final guarantee */}
            <p className="text-white/60 text-sm mt-8 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              {t('premium.7dayMoneybackGuarantee')}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
