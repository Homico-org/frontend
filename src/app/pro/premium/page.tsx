"use client";

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
  Crown,
  Eye,
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
import { useEffect, useState, useRef } from "react";

// Terracotta color palette
const TERRACOTTA = {
  primary: "#C4735B",
  light: "#D4897A",
  dark: "#A85D4A",
  cream: "#F9F5F2",
  sand: "#F0E6DE",
  warm: "#E8DDD5",
};

// Premium tier type
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
  features: {
    icon: React.ElementType;
    text: { en: string; ka: string };
    included?: boolean;
  }[];
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
    gradientFrom: "#4A9B9B",
    gradientTo: "#3D8585",
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
    accentColor: TERRACOTTA.primary,
    gradientFrom: TERRACOTTA.primary,
    gradientTo: TERRACOTTA.dark,
    highlight: { en: "Most Popular", ka: "პოპულარული" },
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
    icon: Crown,
    accentColor: "#B8860B",
    gradientFrom: "#B8860B",
    gradientTo: "#8B6914",
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

// Elite Portfolio Showcase
function EliteShowcase({ locale, isVisible }: { locale: string; isVisible: boolean }) {
  const portfolioImages = [
    { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=90", title: "Modern Living" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=90", title: "Luxury Kitchen" },
    { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=90", title: "Master Suite" },
    { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=90", title: "Office Design" },
  ];

  return (
    <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Section Title */}
      <div className="text-center mb-12">
        <p className="text-sm tracking-[0.3em] uppercase mb-3 font-medium" style={{ color: TERRACOTTA.primary }}>
          {locale === "ka" ? "ელიტა პორტფოლიო" : "Elite Portfolio"}
        </p>
        <h3 className="text-3xl md:text-4xl font-serif text-neutral-800 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {locale === "ka" ? "შენი ნამუშევრები, განსაკუთრებულად" : "Your Work, Elevated"}
        </h3>
        <p className="text-neutral-500 max-w-xl mx-auto">
          {locale === "ka"
            ? "ელიტა პორტფოლიო გაძლევს უნიკალურ დიზაინს რომელიც შენს ნამუშევრებს განსაკუთრებულად წარმოაჩენს"
            : "Elite gives you a bespoke portfolio design that presents your work with the prestige it deserves"}
        </p>
      </div>

      {/* Showcase Container */}
      <div className="relative">
        {/* Floating Badge */}
        <div className="absolute -top-4 left-8 z-20">
          <div
            className="px-4 py-2 rounded-full text-white text-xs font-bold tracking-wider flex items-center gap-2 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}, ${TERRACOTTA.dark})` }}
          >
            <Crown className="w-3.5 h-3.5" />
            ELITE EXCLUSIVE
          </div>
        </div>

        {/* Main Showcase Frame */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: TERRACOTTA.cream,
            border: `1px solid ${TERRACOTTA.sand}`,
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 rounded-tl-2xl" style={{ borderColor: `${TERRACOTTA.primary}40` }} />
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 rounded-br-2xl" style={{ borderColor: `${TERRACOTTA.primary}40` }} />

          {/* Profile Header */}
          <div className="relative p-8 border-b" style={{ borderColor: TERRACOTTA.sand }}>
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full p-1"
                  style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}, ${TERRACOTTA.dark})` }}
                >
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ background: TERRACOTTA.warm }}
                  >
                    <span className="text-3xl font-bold" style={{ color: TERRACOTTA.dark, fontFamily: "'Playfair Display', Georgia, serif" }}>NS</span>
                  </div>
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, #B8860B, #8B6914)` }}
                >
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-2xl font-semibold text-neutral-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {locale === "ka" ? "ნინო სანიკიძე" : "Nino Sanikidze"}
                  </h4>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, #B8860B20, #8B691420)`,
                      border: '1px solid #B8860B40',
                      color: '#8B6914'
                    }}
                  >
                    ELITE
                  </span>
                </div>
                <p className="text-neutral-500 mb-3">
                  {locale === "ka" ? "ინტერიერის დიზაინერი & არქიტექტორი" : "Interior Designer & Architect"}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-neutral-800 font-semibold ml-1">5.0</span>
                  </div>
                  <span className="text-neutral-300">|</span>
                  <span className="text-neutral-500 text-sm">156 {locale === "ka" ? "მიმოხილვა" : "reviews"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Grid */}
          <div className="p-8" style={{ background: 'white' }}>
            <div className="grid grid-cols-12 gap-4">
              {/* Large featured image */}
              <div className="col-span-7 row-span-2 relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3]">
                <img
                  src={portfolioImages[0].url}
                  alt={portfolioImages[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-medium text-lg" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {portfolioImages[0].title}
                  </p>
                  <p className="text-white/70 text-sm mt-1">Tbilisi, 2024</p>
                </div>
                {/* Elite watermark */}
                <div
                  className="absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}E6, ${TERRACOTTA.dark}E6)` }}
                >
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Side images */}
              {portfolioImages.slice(1).map((img, idx) => (
                <div key={idx} className="col-span-5 relative rounded-xl overflow-hidden group cursor-pointer aspect-[4/3]">
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* View all link */}
            <div className="mt-6 flex justify-center">
              <button
                className="group flex items-center gap-2 transition-colors"
                style={{ color: TERRACOTTA.primary }}
              >
                <span className="text-sm tracking-wide">{locale === "ka" ? "ყველა პროექტის ნახვა" : "View All Projects"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3" style={{ borderTop: `1px solid ${TERRACOTTA.sand}`, background: TERRACOTTA.cream }}>
            {[
              { value: "156", label: locale === "ka" ? "პროექტი" : "Projects" },
              { value: "10x", label: locale === "ka" ? "მეტი ნახვა" : "More Views" },
              { value: "#1", label: locale === "ka" ? "ძიებაში" : "In Search" },
            ].map((stat, i) => (
              <div key={i} className="p-6 text-center border-r last:border-r-0" style={{ borderColor: TERRACOTTA.sand }}>
                <p className="text-2xl font-bold" style={{ color: TERRACOTTA.dark, fontFamily: "'Playfair Display', Georgia, serif" }}>{stat.value}</p>
                <p className="text-neutral-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison hint */}
      <div className="mt-8 text-center">
        <p className="text-neutral-400 text-sm flex items-center justify-center gap-2">
          <span className="w-8 h-px" style={{ background: TERRACOTTA.sand }} />
          {locale === "ka" ? "სტანდარტული vs ელიტა პორტფოლიო" : "Standard vs Elite Portfolio"}
          <span className="w-8 h-px" style={{ background: TERRACOTTA.sand }} />
        </p>
      </div>
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
    <div className="border-b last:border-0" style={{ borderColor: TERRACOTTA.sand }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-6 text-left group"
      >
        <span className="font-medium text-neutral-800 group-hover:text-neutral-600 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: isOpen ? TERRACOTTA.primary : '#9CA3AF' }}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-48 pb-6" : "max-h-0"}`}>
        <p className="text-neutral-500 leading-relaxed">{answer}</p>
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
  const [selectedTier, setSelectedTier] = useState<string>("elite");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showcaseVisible, setShowcaseVisible] = useState(false);
  const showcaseRef = useRef<HTMLDivElement>(null);

  const isPro = user?.role === "pro";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTier = (user as any)?.proProfile?.premiumTier || "none";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    trackEvent(AnalyticsEvent.PREMIUM_VIEW);
  }, [trackEvent]);

  // Intersection observer for showcase
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowcaseVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (showcaseRef.current) {
      observer.observe(showcaseRef.current);
    }

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
    const tier = PREMIUM_TIERS[tierId];
    trackEvent(AnalyticsEvent.PREMIUM_CHECKOUT_START, {
      planType: tierId,
      planPrice: tier.price[billingPeriod],
    });
    router.push(`/pro/premium/checkout?tier=${tierId}&period=${billingPeriod}`);
  };

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
  ];

  return (
    <div className="min-h-screen" style={{ background: TERRACOTTA.cream }}>
      {/* Custom font import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>

      <Header />
      <HeaderSpacer />

      <main className={`relative transition-all duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>

        {/* Hero Section */}
        <section className="relative pt-16 pb-24 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Soft gradient orbs */}
            <div
              className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px]"
              style={{ background: `${TERRACOTTA.primary}10` }}
            />
            <div
              className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
              style={{ background: `${TERRACOTTA.light}10` }}
            />

            {/* Decorative lines */}
            <div
              className="absolute top-32 left-0 w-1/3 h-px"
              style={{ background: `linear-gradient(to right, transparent, ${TERRACOTTA.primary}20, transparent)` }}
            />
            <div
              className="absolute top-32 right-0 w-1/3 h-px"
              style={{ background: `linear-gradient(to left, transparent, ${TERRACOTTA.primary}20, transparent)` }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
            {/* Trust Badge */}
            <div className="flex justify-center mb-8">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                style={{ background: 'white', border: `1px solid ${TERRACOTTA.sand}` }}
              >
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}, ${TERRACOTTA.dark})` }}
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-neutral-500 text-sm ml-2">
                  <span className="text-neutral-800 font-semibold">500+</span> {locale === "ka" ? "პროფესიონალი" : "professionals"}
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-neutral-800 mb-6 leading-[1.1]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {locale === "ka" ? (
                  <>
                    შენი ბიზნესი იმსახურებს{" "}
                    <span className="relative inline-block">
                      <span style={{ color: TERRACOTTA.primary }}>
                        განსაკუთრებულს
                      </span>
                      <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                        <path d="M0 8C40 4 80 6 120 4C160 2 180 6 200 5" stroke={TERRACOTTA.primary} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
                      </svg>
                    </span>
                  </>
                ) : (
                  <>
                    Your Business Deserves{" "}
                    <span className="relative inline-block">
                      <span style={{ color: TERRACOTTA.primary }}>
                        Extraordinary
                      </span>
                      <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                        <path d="M0 8C40 4 80 6 120 4C160 2 180 6 200 5" stroke={TERRACOTTA.primary} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4" />
                      </svg>
                    </span>
                  </>
                )}
              </h1>
              <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                {locale === "ka"
                  ? "შეუერთდი ელიტა პროფესიონალებს და გახსენი ახალი შესაძლებლობები"
                  : "Join elite professionals and unlock opportunities that transform your career"}
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div
                className="flex items-center gap-1 p-1 rounded-full"
                style={{ background: 'white', border: `1px solid ${TERRACOTTA.sand}` }}
              >
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    billingPeriod === "monthly" ? "text-white" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {billingPeriod === "monthly" && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}, ${TERRACOTTA.dark})` }}
                    />
                  )}
                  <span className="relative z-10">{locale === "ka" ? "თვიური" : "Monthly"}</span>
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    billingPeriod === "yearly" ? "text-white" : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {billingPeriod === "yearly" && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}, ${TERRACOTTA.dark})` }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {locale === "ka" ? "წლიური" : "Yearly"}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">-17%</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {Object.values(PREMIUM_TIERS).map((tier, index) => {
                const TierIcon = tier.icon;
                const isSelected = selectedTier === tier.id;
                const isElite = tier.id === "elite";
                const price = tier.price[billingPeriod];

                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`relative rounded-2xl p-px cursor-pointer transition-all duration-500 ${
                      isSelected
                        ? isElite
                          ? "scale-[1.02] shadow-2xl"
                          : "scale-[1.02] shadow-xl"
                        : "hover:scale-[1.01]"
                    }`}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`
                        : 'transparent',
                      animationDelay: `${index * 150}ms`,
                    }}
                  >
                    {/* Card inner */}
                    <div
                      className="relative rounded-2xl p-6 h-full"
                      style={{
                        background: 'white',
                        border: isSelected ? 'none' : `1px solid ${TERRACOTTA.sand}`,
                      }}
                    >

                      {/* Popular badge */}
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}, ${TERRACOTTA.dark})` }}
                          >
                            {tier.highlight?.[locale === "ka" ? "ka" : "en"]}
                          </span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="mb-6">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                          style={{
                            background: `linear-gradient(135deg, ${tier.gradientFrom}15, ${tier.gradientTo}08)`,
                          }}
                        >
                          <TierIcon className="w-6 h-6" style={{ color: tier.accentColor }} />
                        </div>
                        <h3 className="text-xl font-semibold text-neutral-800 mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                          {tier.name[locale === "ka" ? "ka" : "en"]}
                        </h3>
                        <p className="text-neutral-500 text-sm">
                          {tier.tagline[locale === "ka" ? "ka" : "en"]}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-neutral-800" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            {tier.currency}{price}
                          </span>
                          <span className="text-neutral-400">
                            /{billingPeriod === "monthly" ? (locale === "ka" ? "თვე" : "mo") : (locale === "ka" ? "წელი" : "yr")}
                          </span>
                        </div>
                        {billingPeriod === "yearly" && (
                          <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {locale === "ka" ? `დაზოგე ₾${tier.price.monthly * 12 - tier.price.yearly}` : `Save ₾${tier.price.monthly * 12 - tier.price.yearly}`}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, i) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <li key={i} className={`flex items-center gap-3 ${feature.included ? "opacity-50" : ""}`}>
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: feature.included ? '#F3F4F6' : `${tier.accentColor}15` }}
                              >
                                {feature.included ? (
                                  <Check className="w-3 h-3 text-neutral-400" />
                                ) : (
                                  <FeatureIcon className="w-3 h-3" style={{ color: tier.accentColor }} />
                                )}
                              </div>
                              <span className={`text-sm ${feature.included ? "text-neutral-400" : "text-neutral-600"}`}>
                                {feature.text[locale === "ka" ? "ka" : "en"]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      {/* CTA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(tier.id);
                        }}
                        disabled={currentTier === tier.id}
                        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          currentTier === tier.id
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                            : isSelected
                              ? "text-white hover:opacity-90"
                              : "text-neutral-700 hover:bg-neutral-100"
                        }`}
                        style={{
                          background: isSelected && currentTier !== tier.id
                            ? `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`
                            : currentTier === tier.id ? undefined : TERRACOTTA.sand,
                        }}
                      >
                        {currentTier === tier.id ? (
                          <>{locale === "ka" ? "მიმდინარე გეგმა" : "Current Plan"}</>
                        ) : (
                          <>
                            {locale === "ka" ? "აირჩიე" : "Get Started"}
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

        {/* Elite Showcase Section */}
        <section ref={showcaseRef} className="py-24" style={{ background: 'white' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <EliteShowcase locale={locale} isVisible={showcaseVisible} />
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20" style={{ background: TERRACOTTA.cream }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Shield, value: "7", label: locale === "ka" ? "დღის გარანტია" : "Day Guarantee" },
                { icon: Crown, value: "500+", label: locale === "ka" ? "ელიტა წევრი" : "Elite Members" },
                { icon: Star, value: "4.9", label: locale === "ka" ? "საშუალო რეიტინგი" : "Avg Rating" },
                { icon: TrendingUp, value: "10x", label: locale === "ka" ? "მეტი ნახვა" : "More Views" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="text-center p-6 rounded-2xl transition-all hover:shadow-lg"
                  style={{ background: 'white', border: `1px solid ${TERRACOTTA.sand}` }}
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-3" style={{ color: TERRACOTTA.primary }} />
                  <p className="text-3xl font-bold text-neutral-800 mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{stat.value}</p>
                  <p className="text-neutral-500 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20" style={{ background: 'white' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-neutral-800 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {locale === "ka" ? "ხშირად დასმული კითხვები" : "Frequently Asked Questions"}
              </h2>
            </div>

            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: TERRACOTTA.cream, border: `1px solid ${TERRACOTTA.sand}` }}
            >
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

        {/* Final CTA */}
        <section className="py-24" style={{ background: TERRACOTTA.cream }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background */}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary}, ${TERRACOTTA.dark})` }}
              />
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.1) 0%, transparent 40%)'
              }} />

              <div className="relative p-12 text-center">
                <Crown className="w-12 h-12 text-white/20 mx-auto mb-6" />
                <h2 className="text-4xl font-semibold text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {locale === "ka" ? "მზად ხარ ელიტა გახდე?" : "Ready to Go Elite?"}
                </h2>
                <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
                  {locale === "ka"
                    ? "შეუერთდი საუკეთესო პროფესიონალებს და გახსენი ახალი შესაძლებლობები"
                    : "Join the best professionals and unlock new opportunities for your business"}
                </p>
                <button
                  onClick={() => handleSelectPlan("elite")}
                  className="px-8 py-4 rounded-xl bg-white font-semibold shadow-2xl hover:bg-neutral-50 hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                  style={{ color: TERRACOTTA.dark }}
                >
                  {locale === "ka" ? "დაიწყე ელიტათი" : "Start with Elite"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
