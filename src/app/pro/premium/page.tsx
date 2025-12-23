"use client";

import AppBackground from "@/components/common/AppBackground";
import Header, { HeaderSpacer } from "@/components/common/Header";
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
  CreditCard,
  Crown,
  Eye,
  Headphones,
  Lock,
  MessageCircle,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Feature type
interface PremiumFeature {
  icon: React.ElementType;
  text: { en: string; ka: string };
  included?: boolean;
}

// Premium tier type
interface PremiumTier {
  id: string;
  name: { en: string; ka: string };
  tagline: { en: string; ka: string };
  price: { monthly: number; yearly: number };
  currency: string;
  icon: React.ElementType;
  accentColor: string;
  features: PremiumFeature[];
  popular: boolean;
  highlight?: { en: string; ka: string };
}

// Premium tier configuration
const PREMIUM_TIERS: Record<string, PremiumTier> = {
  basic: {
    id: "basic",
    name: { en: "Premium", ka: "პრემიუმ" },
    tagline: { en: "Stand out from the crowd", ka: "გამოირჩიე სხვებისგან" },
    price: { monthly: 29, yearly: 290 },
    currency: "₾",
    icon: Star,
    accentColor: "#4A9B9B",
    features: [
      {
        icon: BadgeCheck,
        text: { en: "Premium Badge on Profile", ka: "პრემიუმ ბეჯი პროფილზე" },
      },
      {
        icon: TrendingUp,
        text: {
          en: "Priority in Search Results",
          ka: "პრიორიტეტი ძიების შედეგებში",
        },
      },
      {
        icon: Eye,
        text: { en: "2x More Profile Views", ka: "2x მეტი პროფილის ნახვა" },
      },
      {
        icon: MessageCircle,
        text: {
          en: "Direct Messaging to Clients",
          ka: "პირდაპირი შეტყობინებები",
        },
      },
      {
        icon: Clock,
        text: { en: "Analytics Dashboard", ka: "ანალიტიკის პანელი" },
      },
    ],
    popular: false,
  },
  pro: {
    id: "pro",
    name: { en: "Pro", ka: "პრო" },
    tagline: {
      en: "For serious professionals",
      ka: "სერიოზული პროფესიონალებისთვის",
    },
    price: { monthly: 59, yearly: 590 },
    currency: "₾",
    icon: Zap,
    accentColor: "#E07B4F",
    highlight: { en: "Best Value", ka: "საუკეთესო არჩევანი" },
    features: [
      {
        icon: BadgeCheck,
        text: { en: "Everything in Premium", ka: "ყველაფერი პრემიუმიდან" },
        included: true,
      },
      {
        icon: Crown,
        text: { en: "Pro Badge & Verification", ka: "პრო ბეჯი და ვერიფიკაცია" },
      },
      {
        icon: TrendingUp,
        text: { en: "Top Search Placement", ka: "ტოპ პოზიცია ძიებაში" },
      },
      {
        icon: Eye,
        text: { en: "5x More Profile Views", ka: "5x მეტი პროფილის ნახვა" },
      },
      {
        icon: Sparkles,
        text: { en: "Featured on Homepage", ka: "მთავარ გვერდზე გამოჩენა" },
      },
      {
        icon: Shield,
        text: { en: "Priority Support", ka: "პრიორიტეტული მხარდაჭერა" },
      },
      {
        icon: Award,
        text: { en: "Unlimited Portfolio Items", ka: "შეუზღუდავი პორტფოლიო" },
      },
    ],
    popular: true,
  },
  elite: {
    id: "elite",
    name: { en: "Elite", ka: "ელიტა" },
    tagline: { en: "Maximum visibility & trust", ka: "მაქსიმალური ხილვადობა" },
    price: { monthly: 99, yearly: 990 },
    currency: "₾",
    icon: Crown,
    accentColor: "#8B6914",
    features: [
      {
        icon: BadgeCheck,
        text: { en: "Everything in Pro", ka: "ყველაფერი პრო-დან" },
        included: true,
      },
      { icon: Crown, text: { en: "Elite Gold Badge", ka: "ელიტა ოქროს ბეჯი" } },
      {
        icon: TrendingUp,
        text: { en: "#1 Search Priority", ka: "#1 ძიების პრიორიტეტი" },
      },
      {
        icon: Eye,
        text: { en: "10x More Profile Views", ka: "10x მეტი ნახვა" },
      },
      {
        icon: Sparkles,
        text: {
          en: "Exclusive Homepage Spotlight",
          ka: "ექსკლუზიური სპოტლაითი",
        },
      },
      {
        icon: Headphones,
        text: { en: "Dedicated Account Manager", ka: "პერსონალური მენეჯერი" },
      },
      {
        icon: MessageCircle,
        text: { en: "WhatsApp/Viber Support", ka: "WhatsApp/Viber მხარდაჭერა" },
      },
      {
        icon: Award,
        text: { en: "Custom Profile Design", ka: "პერსონალური დიზაინი" },
      },
    ],
    popular: false,
  },
};

type BillingPeriod = "monthly" | "yearly";

// Testimonial data
const testimonials = [
  {
    name: "გიორგი ბერიძე",
    nameEn: "Giorgi Beridze",
    role: { en: "Interior Designer", ka: "ინტერიერის დიზაინერი" },
    avatar: "/api/placeholder/64/64",
    text: {
      en: "Since upgrading to Pro, I've received 3x more client inquiries. The investment paid for itself in the first week!",
      ka: "პრო-ზე გადასვლის შემდეგ 3-ჯერ მეტი მოთხოვნა მივიღე. ინვესტიცია პირველივე კვირაში ამოიღო!",
    },
    rating: 5,
    tier: "pro",
  },
  {
    name: "ნინო კვარაცხელია",
    nameEn: "Nino Kvaratskhelia",
    role: { en: "Architect", ka: "არქიტექტორი" },
    avatar: "/api/placeholder/64/64",
    text: {
      en: "The Elite plan's dedicated manager helped me land my biggest project yet. Worth every lari!",
      ka: "ელიტა გეგმის პერსონალური მენეჯერის დახმარებით ჩემი ყველაზე დიდი პროექტი მოვიპოვე!",
    },
    rating: 5,
    tier: "elite",
  },
  {
    name: "დავით მაისურაძე",
    nameEn: "David Maisuradze",
    role: { en: "Master Plumber", ka: "სანტექნიკის ოსტატი" },
    avatar: "/api/placeholder/64/64",
    text: {
      en: "Premium badge gave my profile instant credibility. Clients trust verified professionals more.",
      ka: "პრემიუმ ბეჯმა ჩემს პროფილს სანდოობა შემატა. კლიენტები ვერიფიცირებულ პროფესიონალებს უფრო ენდობიან.",
    },
    rating: 5,
    tier: "basic",
  },
];

// Stats data
const stats = [
  { value: "3x", label: { en: "More Client Inquiries", ka: "მეტი მოთხოვნა" } },
  {
    value: "500+",
    label: { en: "Premium Professionals", ka: "პრემიუმ პროფესიონალი" },
  },
  { value: "98%", label: { en: "Satisfaction Rate", ka: "კმაყოფილება" } },
  { value: "24h", label: { en: "Avg. Response Time", ka: "საშ. პასუხის დრო" } },
];

// FAQ Component with smooth accordion
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
    <div className="border-b border-[var(--color-border-subtle)] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-medium text-[var(--color-text-primary)] leading-relaxed group-hover:text-[#E07B4F] transition-colors">
          {question}
        </span>
        <div
          className={`w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? "bg-[#E07B4F]/10 rotate-180" : ""}`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-colors ${isOpen ? "text-[#E07B4F]" : "text-[var(--color-text-tertiary)]"}`}
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? "max-h-48 pb-5" : "max-h-0"}`}
      >
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed pr-12">
          {answer}
        </p>
      </div>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({
  testimonial,
  locale,
}: {
  testimonial: (typeof testimonials)[0];
  locale: string;
}) {
  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-6 border border-[var(--color-border-subtle)] shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4A9B9B] to-[#3D8585] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {(locale === "ka" ? testimonial.name : testimonial.nameEn).charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--color-text-primary)] truncate">
            {locale === "ka" ? testimonial.name : testimonial.nameEn}
          </h4>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {testimonial.role[locale === "ka" ? "ka" : "en"]}
          </p>
        </div>
        <div className="flex gap-0.5">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>
      <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
        "{testimonial.text[locale === "ka" ? "ka" : "en"]}"
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            testimonial.tier === "elite"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
              : testimonial.tier === "pro"
                ? "bg-[#E07B4F]/10 text-[#E07B4F]"
                : "bg-[#4A9B9B]/10 text-[#4A9B9B]"
          }`}
        >
          {testimonial.tier === "elite"
            ? "Elite"
            : testimonial.tier === "pro"
              ? "Pro"
              : "Premium"}{" "}
          {locale === "ka" ? "მომხმარებელი" : "Member"}
        </span>
      </div>
    </div>
  );
}

export default function PremiumPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const isPro = user?.role === "pro";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTier = (user as any)?.proProfile?.premiumTier || "none";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Track premium page view
  useEffect(() => {
    trackEvent(AnalyticsEvent.PREMIUM_VIEW);
  }, [trackEvent]);

  const handleSelectPlan = (tierId: string) => {
    if (!isAuthenticated) {
      router.push("/register?redirect=/pro/premium");
      return;
    }
    if (!isPro) {
      router.push("/become-pro?redirect=/pro/premium");
      return;
    }
    const tier = PREMIUM_TIERS[tierId];
    trackEvent(AnalyticsEvent.PREMIUM_CHECKOUT_START, {
      planType: tierId,
      planPrice: tier.price[billingPeriod],
    });
    router.push(`/pro/premium/checkout?tier=${tierId}&period=${billingPeriod}`);
  };

  const faqs = [
    {
      q: {
        en: "Can I upgrade or downgrade my plan?",
        ka: "შემიძლია გეგმის შეცვლა?",
      },
      a: {
        en: "Yes! You can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the credit will be applied to future billing.",
        ka: "დიახ! შეგიძლია გეგმის შეცვლა ნებისმიერ დროს. გაუმჯობესებისას გადაიხდი სხვაობას, ხოლო დაქვეითებისას კრედიტი გადაინაცვლებს მომავალ გადახდაზე.",
      },
    },
    {
      q: {
        en: "What payment methods do you accept?",
        ka: "რა გადახდის მეთოდებს იღებთ?",
      },
      a: {
        en: "We accept all major credit/debit cards, Bank of Georgia, TBC Bank, and Liberty Bank transfers.",
        ka: "ვიღებთ ყველა ძირითად საკრედიტო/სადებეტო ბარათს, საქართველოს ბანკს, თიბისი ბანკს და ლიბერთი ბანკის გადარიცხვებს.",
      },
    },
    {
      q: {
        en: "How does the 7-day guarantee work?",
        ka: "როგორ მუშაობს 7 დღიანი გარანტია?",
      },
      a: {
        en: "If you're not satisfied within the first 7 days, contact us and we'll refund 100% of your payment. No questions asked.",
        ka: "თუ პირველი 7 დღის განმავლობაში არ ხარ კმაყოფილი, დაგვიკავშირდი და დაგიბრუნებთ 100%-ს. ყოველგვარი კითხვის გარეშე.",
      },
    },
    {
      q: { en: "When will I see results?", ka: "როდის ვნახავ შედეგებს?" },
      a: {
        en: "Most professionals see increased profile views and client inquiries within the first week of upgrading.",
        ka: "პროფესიონალების უმეტესობა ხედავს პროფილის ნახვების და კლიენტების მოთხოვნების ზრდას პირველივე კვირაში.",
      },
    },
    {
      q: {
        en: "Is my payment information secure?",
        ka: "დაცულია ჩემი გადახდის ინფორმაცია?",
      },
      a: {
        en: "Absolutely. We use bank-level SSL encryption and never store your full card details. All payments are processed through certified payment providers.",
        ka: "აბსოლუტურად. ვიყენებთ საბანკო დონის SSL დაშიფვრას და არასდროს ვინახავთ თქვენს სრულ ბარათის მონაცემებს.",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      <main
        className={`relative z-10 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Hero Section */}
        <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-20 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-[#E07B4F]/5 blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#4A9B9B]/5 blur-[80px]" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            {/* Trust Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-sm">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4A9B9B] to-[#3D8585] border-2 border-[var(--color-bg-elevated)] flex items-center justify-center text-white text-xs font-medium"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-[var(--color-text-secondary)] ml-1">
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    500+
                  </span>{" "}
                  {locale === "ka" ? "პროფესიონალი" : "professionals trust us"}
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-6 tracking-tight leading-[1.1]">
                {locale === "ka" ? (
                  <>
                    გაზარდე შენი{" "}
                    <span className="relative inline-block">
                      <span className="text-[#E07B4F]">ბიზნესი</span>
                      <svg
                        className="absolute -bottom-1 left-0 w-full h-3"
                        viewBox="0 0 200 12"
                        fill="none"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M2 8C50 4 150 4 198 8"
                          stroke="#E07B4F"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeOpacity="0.3"
                        />
                      </svg>
                    </span>
                    <br />
                    პრემიუმ გეგმით
                  </>
                ) : (
                  <>
                    Grow Your{" "}
                    <span className="relative inline-block">
                      <span className="text-[#E07B4F]">Business</span>
                      <svg
                        className="absolute -bottom-1 left-0 w-full h-3"
                        viewBox="0 0 200 12"
                        fill="none"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M2 8C50 4 150 4 198 8"
                          stroke="#E07B4F"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeOpacity="0.3"
                        />
                      </svg>
                    </span>
                    <br />
                    with Premium
                  </>
                )}
              </h1>

              <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
                {locale === "ka"
                  ? "მიიღე მეტი კლიენტი, გაზარდე შენი ხილვადობა და გამოირჩიე კონკურენტებისგან. უსაფრთხო, სანდო და გამჭვირვალე."
                  : "Get more clients, increase your visibility, and stand out. Secure, trusted, and transparent pricing."}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto mb-16">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="text-center p-4 rounded-2xl bg-[var(--color-bg-elevated)]/50 border border-[var(--color-border-subtle)]"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-[#E07B4F] mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--color-text-tertiary)]">
                    {stat.label[locale === "ka" ? "ka" : "en"]}
                  </div>
                </div>
              ))}
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-sm">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingPeriod === "monthly"
                      ? "text-white"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {billingPeriod === "monthly" && (
                    <div className="absolute inset-0 rounded-full bg-[#E07B4F] shadow-lg shadow-[#E07B4F]/20" />
                  )}
                  <span className="relative z-10">
                    {locale === "ka" ? "თვიური" : "Monthly"}
                  </span>
                </button>

                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingPeriod === "yearly"
                      ? "text-white"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {billingPeriod === "yearly" && (
                    <div className="absolute inset-0 rounded-full bg-[#E07B4F] shadow-lg shadow-[#E07B4F]/20" />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {locale === "ka" ? "წლიური" : "Yearly"}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                      -17%
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="pb-20 sm:pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {Object.values(PREMIUM_TIERS).map((tier, index) => {
                const TierIcon = tier.icon;
                const isCurrentPlan = currentTier === tier.id;
                const price = tier.price[billingPeriod];
                const yearlyPrice = tier.price.yearly;
                const monthlyTotal = tier.price.monthly * 12;

                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl transition-all duration-500 flex flex-col ${
                      tier.popular
                        ? "bg-[var(--color-bg-elevated)] border-2 border-[#E07B4F]/30 shadow-xl shadow-[#E07B4F]/5 md:-mt-4 md:mb-4"
                        : "bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-sm hover:shadow-md"
                    }`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {/* Popular Badge */}
                    {tier.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <div className="px-4 py-1.5 rounded-full bg-[#E07B4F] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#E07B4F]/25 whitespace-nowrap flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          {tier.highlight?.[locale === "ka" ? "ka" : "en"]}
                        </div>
                      </div>
                    )}

                    <div className="p-6 sm:p-8 pt-8 flex flex-col flex-1">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                            style={{ backgroundColor: `${tier.accentColor}15` }}
                          >
                            <TierIcon
                              className="w-6 h-6"
                              style={{ color: tier.accentColor }}
                            />
                          </div>
                          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
                            {tier.name[locale === "ka" ? "ka" : "en"]}
                          </h3>
                          <p className="text-sm text-[var(--color-text-tertiary)]">
                            {tier.tagline[locale === "ka" ? "ka" : "en"]}
                          </p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="mb-6 pb-6 border-b border-[var(--color-border-subtle)]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                            {tier.currency}
                            {price}
                          </span>
                          <span className="text-sm text-[var(--color-text-tertiary)]">
                            /
                            {billingPeriod === "monthly"
                              ? locale === "ka"
                                ? "თვე"
                                : "mo"
                              : locale === "ka"
                                ? "წელი"
                                : "yr"}
                          </span>
                        </div>
                        {billingPeriod === "yearly" && (
                          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {locale === "ka"
                              ? `დაზოგე ${tier.currency}${monthlyTotal - yearlyPrice}`
                              : `Save ${tier.currency}${monthlyTotal - yearlyPrice}/year`}
                          </p>
                        )}
                      </div>

                      {/* Features - flex-1 to take remaining space */}
                      <ul className="space-y-3 flex-1">
                        {tier.features.map((feature, i) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-3 ${feature.included ? "opacity-60" : ""}`}
                            >
                              <div
                                className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                                style={{
                                  backgroundColor: feature.included
                                    ? "var(--color-bg-tertiary)"
                                    : `${tier.accentColor}15`,
                                }}
                              >
                                {feature.included ? (
                                  <Check className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                                ) : (
                                  <FeatureIcon
                                    className="w-3 h-3"
                                    style={{ color: tier.accentColor }}
                                  />
                                )}
                              </div>
                              <span
                                className={`text-sm ${feature.included ? "text-[var(--color-text-tertiary)]" : "text-[var(--color-text-secondary)]"}`}
                              >
                                {feature.text[locale === "ka" ? "ka" : "en"]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      {/* CTA Button - mt-auto to push to bottom */}
                      <button
                        onClick={() => handleSelectPlan(tier.id)}
                        disabled={isCurrentPlan}
                        className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-8 ${
                          isCurrentPlan
                            ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] cursor-not-allowed"
                            : tier.popular
                              ? "bg-[#E07B4F] text-white shadow-lg shadow-[#E07B4F]/20 hover:shadow-xl hover:shadow-[#E07B4F]/30 hover:-translate-y-0.5"
                              : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)] border border-[var(--color-border-subtle)]"
                        }`}
                      >
                        {isCurrentPlan ? (
                          <>
                            <Check className="w-4 h-4" />{" "}
                            {locale === "ka"
                              ? "მიმდინარე გეგმა"
                              : "Current Plan"}
                          </>
                        ) : (
                          <>
                            {locale === "ka" ? "აირჩიე გეგმა" : "Get Started"}{" "}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="py-16 sm:py-20 bg-[var(--color-bg-secondary)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                {locale === "ka" ? "უსაფრთხო და სანდო" : "Safe & Trusted"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                {locale === "ka"
                  ? "შენი უსაფრთხოება ჩვენი პრიორიტეტია"
                  : "Your Security is Our Priority"}
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                {locale === "ka"
                  ? "ვიყენებთ უახლეს ტექნოლოგიებს თქვენი მონაცემების და გადახდების დასაცავად"
                  : "We use the latest technology to protect your data and payments"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: Shield,
                  title: { en: "7-Day Guarantee", ka: "7 დღის გარანტია" },
                  desc: {
                    en: "Full refund, no questions",
                    ka: "სრული თანხის დაბრუნება",
                  },
                  color: "#E07B4F",
                },
                {
                  icon: Lock,
                  title: { en: "SSL Encrypted", ka: "SSL დაშიფრული" },
                  desc: {
                    en: "Bank-level security",
                    ka: "საბანკო დონის დაცვა",
                  },
                  color: "#4A9B9B",
                },
                {
                  icon: CreditCard,
                  title: { en: "Secure Payments", ka: "უსაფრთხო გადახდა" },
                  desc: {
                    en: "PCI DSS compliant",
                    ka: "PCI DSS სერტიფიცირებული",
                  },
                  color: "#6366F1",
                },
                {
                  icon: RefreshCw,
                  title: {
                    en: "Cancel Anytime",
                    ka: "გაუქმება ნებისმიერ დროს",
                  },
                  desc: {
                    en: "No lock-in contracts",
                    ka: "ხელშეკრულების გარეშე",
                  },
                  color: "#10B981",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-center hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon
                      className="w-6 h-6"
                      style={{ color: item.color }}
                    />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1 text-sm sm:text-base">
                    {item.title[locale === "ka" ? "ka" : "en"]}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-tertiary)]">
                    {item.desc[locale === "ka" ? "ka" : "en"]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-4">
                <Star className="w-4 h-4 fill-current" />
                {locale === "ka"
                  ? "კლიენტების მოწონება"
                  : "Loved by Professionals"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                {locale === "ka"
                  ? "რას ამბობენ ჩვენი მომხმარებლები"
                  : "What Our Members Say"}
              </h2>
              <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                {locale === "ka"
                  ? "გაიგე როგორ დაეხმარა პრემიუმ გეგმა სხვა პროფესიონალებს"
                  : "See how Premium has helped other professionals grow their business"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <TestimonialCard
                  key={i}
                  testimonial={testimonial}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 sm:py-20 bg-[var(--color-bg-secondary)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4A9B9B]/10 text-[#4A9B9B] text-sm font-medium mb-4">
                <MessageCircle className="w-4 h-4" />
                {locale === "ka" ? "კითხვები?" : "Questions?"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                {locale === "ka"
                  ? "ხშირად დასმული კითხვები"
                  : "Frequently Asked Questions"}
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                {locale === "ka"
                  ? "პასუხები გავრცელებულ კითხვებზე"
                  : "Quick answers to common questions"}
              </p>
            </div>

            <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)] p-6 sm:p-8">
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

            {/* Support CTA */}
            <div className="mt-8 text-center">
              <p className="text-[var(--color-text-secondary)] mb-4">
                {locale === "ka"
                  ? "კიდევ გაქვს კითხვები?"
                  : "Still have questions?"}
              </p>
              <a
                href="mailto:info@homico.ge"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-medium hover:border-[#E07B4F]/30 hover:bg-[#E07B4F]/5 transition-all"
              >
                <Headphones className="w-4 h-4 text-[#E07B4F]" />
                {locale === "ka" ? "დაგვიკავშირდი" : "Contact Support"}
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E07B4F] to-[#D26B3F] p-8 sm:p-12 text-center text-white">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  {locale === "ka"
                    ? "გაზარდე შესაძლებლობები"
                    : "Level Up Today"}
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  {locale === "ka"
                    ? "მზად ხარ მეტი კლიენტისთვის?"
                    : "Ready for More Clients?"}
                </h2>

                <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                  {locale === "ka"
                    ? "შეუერთდი 500+ პროფესიონალს რომლებმაც უკვე გაზარდეს თავიანთი ბიზნესი პრემიუმ გეგმით."
                    : "Join 500+ professionals who have already grown their business with a Premium plan."}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => handleSelectPlan("pro")}
                    className="px-8 py-4 rounded-xl bg-white text-[#E07B4F] font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                  >
                    {locale === "ka" ? "დაიწყე პრო გეგმით" : "Start with Pro"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Shield className="w-4 h-4" />
                    {locale === "ka"
                      ? "7 დღის თანხის დაბრუნების გარანტია"
                      : "7-day money-back guarantee"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
