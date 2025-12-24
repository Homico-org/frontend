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
  Image as ImageIcon,
  Layout,
  Lock,
  MessageCircle,
  Palette,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Accent color
const ACCENT_COLOR = "#E07B4F";

// Premium tier type
interface PremiumTier {
  id: string;
  name: { en: string; ka: string };
  tagline: { en: string; ka: string };
  price: { monthly: number; yearly: number };
  currency: string;
  icon: React.ElementType;
  accentColor: string;
  features: {
    icon: React.ElementType;
    text: { en: string; ka: string };
    included?: boolean;
  }[];
  benefits: {
    icon: React.ElementType;
    title: { en: string; ka: string };
    description: { en: string; ka: string };
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
    features: [
      { icon: BadgeCheck, text: { en: "Premium Badge on Profile", ka: "პრემიუმ ბეჯი პროფილზე" } },
      { icon: TrendingUp, text: { en: "Priority in Search Results", ka: "პრიორიტეტი ძიების შედეგებში" } },
      { icon: Eye, text: { en: "2x More Profile Views", ka: "2x მეტი პროფილის ნახვა" } },
      { icon: MessageCircle, text: { en: "Direct Messaging to Clients", ka: "პირდაპირი შეტყობინებები" } },
      { icon: Clock, text: { en: "Analytics Dashboard", ka: "ანალიტიკის პანელი" } },
    ],
    benefits: [
      {
        icon: BadgeCheck,
        title: { en: "Verified Badge", ka: "ვერიფიცირებული ბეჯი" },
        description: { en: "Show clients you're a trusted professional with a premium badge on your profile", ka: "აჩვენე კლიენტებს რომ ხარ სანდო პროფესიონალი პრემიუმ ბეჯით" },
      },
      {
        icon: TrendingUp,
        title: { en: "Better Visibility", ka: "უკეთესი ხილვადობა" },
        description: { en: "Appear higher in search results and get discovered by more clients", ka: "გამოჩნდი ძიების შედეგებში უფრო მაღლა და მიიღე მეტი კლიენტი" },
      },
      {
        icon: Clock,
        title: { en: "Performance Insights", ka: "შესრულების ანალიზი" },
        description: { en: "Track your profile views, client inquiries, and growth over time", ka: "თვალი ადევნე პროფილის ნახვებს, კლიენტების მოთხოვნებს და ზრდას" },
      },
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
    accentColor: "#E07B4F",
    highlight: { en: "Best Value", ka: "საუკეთესო არჩევანი" },
    features: [
      { icon: BadgeCheck, text: { en: "Everything in Premium", ka: "ყველაფერი პრემიუმიდან" }, included: true },
      { icon: Crown, text: { en: "Pro Badge & Verification", ka: "პრო ბეჯი და ვერიფიკაცია" } },
      { icon: TrendingUp, text: { en: "Top Search Placement", ka: "ტოპ პოზიცია ძიებაში" } },
      { icon: Eye, text: { en: "5x More Profile Views", ka: "5x მეტი პროფილის ნახვა" } },
      { icon: Sparkles, text: { en: "Featured on Homepage", ka: "მთავარ გვერდზე გამოჩენა" } },
      { icon: Shield, text: { en: "Priority Support", ka: "პრიორიტეტული მხარდაჭერა" } },
      { icon: Award, text: { en: "Unlimited Portfolio Items", ka: "შეუზღუდავი პორტფოლიო" } },
    ],
    benefits: [
      {
        icon: Sparkles,
        title: { en: "Homepage Featured", ka: "მთავარ გვერდზე გამოჩენა" },
        description: { en: "Get featured on the homepage carousel and reach thousands of potential clients daily", ka: "გამოჩნდი მთავარ გვერდის კარუსელში და მიაღწიე ათასობით კლიენტს ყოველდღე" },
      },
      {
        icon: TrendingUp,
        title: { en: "5x More Views", ka: "5x მეტი ნახვა" },
        description: { en: "Our Pro members receive 5 times more profile views on average compared to free accounts", ka: "პრო წევრები იღებენ საშუალოდ 5-ჯერ მეტ პროფილის ნახვას უფასო ანგარიშებთან შედარებით" },
      },
      {
        icon: Shield,
        title: { en: "Priority Support", ka: "პრიორიტეტული მხარდაჭერა" },
        description: { en: "Get faster responses from our support team and resolve issues quickly", ka: "მიიღე უფრო სწრაფი პასუხები ჩვენი მხარდაჭერის გუნდისგან" },
      },
      {
        icon: Award,
        title: { en: "Unlimited Portfolio", ka: "შეუზღუდავი პორტფოლიო" },
        description: { en: "Showcase all your work with no limits on portfolio items or images", ka: "აჩვენე შენი ყველა ნამუშევარი პორტფოლიოში ლიმიტის გარეშე" },
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
      { icon: BadgeCheck, text: { en: "Everything in Pro", ka: "ყველაფერი პრო-დან" }, included: true },
      { icon: Crown, text: { en: "Elite Gold Badge", ka: "ელიტა ოქროს ბეჯი" } },
      { icon: TrendingUp, text: { en: "#1 Search Priority", ka: "#1 ძიების პრიორიტეტი" } },
      { icon: Eye, text: { en: "10x More Profile Views", ka: "10x მეტი ნახვა" } },
      { icon: Sparkles, text: { en: "Exclusive Homepage Spotlight", ka: "ექსკლუზიური სპოტლაითი" } },
      { icon: Headphones, text: { en: "Dedicated Account Manager", ka: "პერსონალური მენეჯერი" } },
      { icon: MessageCircle, text: { en: "WhatsApp/Viber Support", ka: "WhatsApp/Viber მხარდაჭერა" } },
      { icon: Palette, text: { en: "Custom Portfolio Design", ka: "პერსონალური პორტფოლიო დიზაინი" } },
    ],
    benefits: [
      {
        icon: Crown,
        title: { en: "Elite Gold Badge", ka: "ელიტა ოქროს ბეჯი" },
        description: { en: "Stand out with a prestigious gold badge that signals top-tier quality to clients", ka: "გამოირჩიე პრესტიჟული ოქროს ბეჯით რომელიც კლიენტებს აჩვენებს უმაღლეს ხარისხს" },
      },
      {
        icon: Headphones,
        title: { en: "Personal Manager", ka: "პერსონალური მენეჯერი" },
        description: { en: "Get dedicated support from your own account manager who knows your business", ka: "მიიღე პერსონალური მხარდაჭერა შენი საკუთარი მენეჯერისგან რომელიც იცნობს შენს ბიზნესს" },
      },
      {
        icon: Palette,
        title: { en: "Custom Portfolio Design", ka: "პერსონალური პორტფოლიო" },
        description: { en: "Get a unique, professionally designed portfolio page that showcases your work beautifully", ka: "მიიღე უნიკალური, პროფესიონალურად დიზაინირებული პორტფოლიოს გვერდი" },
      },
      {
        icon: Layout,
        title: { en: "Premium Profile Layout", ka: "პრემიუმ პროფილის განლაგება" },
        description: { en: "Your profile gets a special enhanced layout with larger images and featured sections", ka: "შენი პროფილი იღებს გაუმჯობესებულ განლაგებას უფრო დიდი სურათებით" },
      },
    ],
    popular: false,
  },
};

type BillingPeriod = "monthly" | "yearly";

// Elite Portfolio Preview Component
function ElitePortfolioPreview({ locale }: { locale: string }) {
  const sampleImages = [
    { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600", title: "Modern Living Room" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600", title: "Luxury Kitchen" },
    { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600", title: "Master Bedroom" },
    { url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600", title: "Bathroom Design" },
    { url: "https://images.unsplash.com/photo-1600573472591-ee6c563aaec4?w=600", title: "Office Space" },
    { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600", title: "Terrace" },
  ];

  return (
    <div className="relative mt-8">
      {/* Preview Label */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          {locale === "ka" ? "პორტფოლიოს გადახედვა" : "Portfolio Preview"}
        </div>
      </div>

      {/* Elite Portfolio Card */}
      <div className="rounded-2xl border-2 border-amber-400/30 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-900/10 dark:to-neutral-900 overflow-hidden shadow-xl">
        {/* Elite Header */}
        <div className="p-6 border-b border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                GS
              </div>
              {/* Elite Badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white dark:border-neutral-800 flex items-center justify-center shadow-md">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {locale === "ka" ? "გიორგი სანიკიძე" : "Giorgi Sanikidze"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold">
                  ELITE
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                {locale === "ka" ? "ინტერიერის დიზაინერი" : "Interior Designer"}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">4.9</span>
                </div>
                <span className="text-neutral-400">•</span>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  127 {locale === "ka" ? "მიმოხილვა" : "reviews"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Grid - Elite Style */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
            </h4>
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {locale === "ka" ? "ყველას ნახვა" : "View all"} →
            </span>
          </div>

          {/* Masonry-like Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Large featured image */}
            <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden group cursor-pointer">
              <img
                src={sampleImages[0].url}
                alt={sampleImages[0].title}
                className="w-full h-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-medium text-sm">{sampleImages[0].title}</p>
              </div>
              {/* Elite Watermark */}
              <div className="absolute top-3 right-3">
                <div className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-400/90 to-amber-600/90 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> ELITE
                </div>
              </div>
            </div>

            {/* Smaller images */}
            {sampleImages.slice(1, 4).map((img, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden group cursor-pointer">
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {/* View More */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {sampleImages.slice(4).map((img, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden group cursor-pointer">
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover aspect-video group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
            <div className="rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center aspect-video cursor-pointer hover:from-amber-200 hover:to-amber-100 dark:hover:from-amber-900/40 transition-colors">
              <div className="text-center">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">+24</span>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                  {locale === "ka" ? "მეტი" : "more"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Elite Features Banner */}
        <div className="px-6 pb-6">
          <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-500/20 dark:to-amber-600/20 p-4 border border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {locale === "ka" ? "ელიტა პორტფოლიო დიზაინი" : "Elite Portfolio Design"}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                  {locale === "ka"
                    ? "უნიკალური განლაგება, დიდი სურათები, პრემიუმ ეფექტები"
                    : "Unique layout, larger images, premium effects"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Note */}
      <div className="mt-4 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {locale === "ka"
            ? "↑ ელიტა პორტფოლიო vs სტანდარტული პროფილი ↓"
            : "↑ Elite portfolio vs Standard profile ↓"}
        </p>
      </div>

      {/* Standard Portfolio Comparison */}
      <div className="mt-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden opacity-60">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div>
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="h-3 w-24 bg-neutral-100 dark:bg-neutral-600 rounded mt-2" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-neutral-100 dark:bg-neutral-700 rounded-lg" />
            ))}
          </div>
        </div>
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

export default function PremiumPlansPage() {
  const { user, isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [selectedTier, setSelectedTier] = useState<string>("pro");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const isPro = user?.role === "pro";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTier = (user as any)?.proProfile?.premiumTier || "none";

  useEffect(() => {
    setIsVisible(true);
  }, []);

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

  const currentSelectedTier = PREMIUM_TIERS[selectedTier];

  const faqs = [
    {
      q: { en: "Can I upgrade or downgrade my plan?", ka: "შემიძლია გეგმის შეცვლა?" },
      a: {
        en: "Yes! You can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated difference.",
        ka: "დიახ! შეგიძლია გეგმის შეცვლა ნებისმიერ დროს. გაუმჯობესებისას გადაიხდი სხვაობას.",
      },
    },
    {
      q: { en: "What payment methods do you accept?", ka: "რა გადახდის მეთოდებს იღებთ?" },
      a: {
        en: "We accept all major credit/debit cards, Bank of Georgia, TBC Bank, and Liberty Bank transfers.",
        ka: "ვიღებთ ყველა ძირითად საკრედიტო/სადებეტო ბარათს და საბანკო გადარიცხვებს.",
      },
    },
    {
      q: { en: "How does the 7-day guarantee work?", ka: "როგორ მუშაობს 7 დღიანი გარანტია?" },
      a: {
        en: "If you're not satisfied within the first 7 days, contact us and we'll refund 100% of your payment.",
        ka: "თუ პირველი 7 დღის განმავლობაში არ ხარ კმაყოფილი, დაგვიკავშირდი და დაგიბრუნებთ 100%-ს.",
      },
    },
    {
      q: { en: "When will I see results?", ka: "როდის ვნახავ შედეგებს?" },
      a: {
        en: "Most professionals see increased profile views and client inquiries within the first week.",
        ka: "პროფესიონალების უმეტესობა ხედავს ზრდას პირველივე კვირაში.",
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
        <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-8 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-[#E07B4F]/5 blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#4A9B9B]/5 blur-[80px]" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-6 tracking-tight leading-[1.1]">
                {locale === "ka" ? (
                  <>
                    აირჩიე შენი{" "}
                    <span className="text-[#E07B4F]">გეგმა</span>
                  </>
                ) : (
                  <>
                    Choose Your{" "}
                    <span className="text-[#E07B4F]">Plan</span>
                  </>
                )}
              </h1>
              <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                {locale === "ka"
                  ? "მიიღე მეტი კლიენტი და გაზარდე შენი ხილვადობა პრემიუმ გეგმით"
                  : "Get more clients and increase your visibility with a premium plan"}
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-10">
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
                  <span className="relative z-10">{locale === "ka" ? "თვიური" : "Monthly"}</span>
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

        {/* Plan Tabs Section */}
        <section className="pb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Tier Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] p-1.5 shadow-sm">
                {Object.values(PREMIUM_TIERS).map((tier) => {
                  const TierIcon = tier.icon;
                  const isSelected = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isSelected
                          ? "text-white shadow-lg"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                      }`}
                      style={{
                        backgroundColor: isSelected ? tier.accentColor : undefined,
                        boxShadow: isSelected ? `0 4px 14px ${tier.accentColor}30` : undefined,
                      }}
                    >
                      <TierIcon className="w-4 h-4" />
                      {tier.name[locale === "ka" ? "ka" : "en"]}
                      {tier.popular && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isSelected ? "bg-white/20" : "bg-[#E07B4F]/10 text-[#E07B4F]"}`}>
                          {locale === "ka" ? "TOP" : "TOP"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Plan Card + Benefits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Plan Card */}
              <div
                className="rounded-2xl bg-[var(--color-bg-elevated)] border-2 shadow-xl overflow-hidden transition-all duration-500"
                style={{ borderColor: `${currentSelectedTier.accentColor}30` }}
              >
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                        style={{ backgroundColor: `${currentSelectedTier.accentColor}15` }}
                      >
                        <currentSelectedTier.icon
                          className="w-7 h-7"
                          style={{ color: currentSelectedTier.accentColor }}
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                        {currentSelectedTier.name[locale === "ka" ? "ka" : "en"]}
                      </h3>
                      <p className="text-[var(--color-text-tertiary)]">
                        {currentSelectedTier.tagline[locale === "ka" ? "ka" : "en"]}
                      </p>
                    </div>
                    {currentSelectedTier.popular && (
                      <div
                        className="px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-lg"
                        style={{ backgroundColor: currentSelectedTier.accentColor }}
                      >
                        {currentSelectedTier.highlight?.[locale === "ka" ? "ka" : "en"]}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-[var(--color-border-subtle)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-[var(--color-text-primary)]">
                        {currentSelectedTier.currency}
                        {currentSelectedTier.price[billingPeriod]}
                      </span>
                      <span className="text-lg text-[var(--color-text-tertiary)]">
                        /{billingPeriod === "monthly" ? (locale === "ka" ? "თვე" : "mo") : (locale === "ka" ? "წელი" : "yr")}
                      </span>
                    </div>
                    {billingPeriod === "yearly" && (
                      <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {locale === "ka"
                          ? `დაზოგე ${currentSelectedTier.currency}${currentSelectedTier.price.monthly * 12 - currentSelectedTier.price.yearly}`
                          : `Save ${currentSelectedTier.currency}${currentSelectedTier.price.monthly * 12 - currentSelectedTier.price.yearly}/year`}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {currentSelectedTier.features.map((feature, i) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <li key={i} className={`flex items-start gap-3 ${feature.included ? "opacity-60" : ""}`}>
                          <div
                            className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                            style={{
                              backgroundColor: feature.included
                                ? "var(--color-bg-tertiary)"
                                : `${currentSelectedTier.accentColor}15`,
                            }}
                          >
                            {feature.included ? (
                              <Check className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                            ) : (
                              <FeatureIcon className="w-3 h-3" style={{ color: currentSelectedTier.accentColor }} />
                            )}
                          </div>
                          <span className={`text-sm ${feature.included ? "text-[var(--color-text-tertiary)]" : "text-[var(--color-text-secondary)]"}`}>
                            {feature.text[locale === "ka" ? "ka" : "en"]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelectPlan(selectedTier)}
                    disabled={currentTier === selectedTier}
                    className="w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    style={{
                      backgroundColor: currentTier === selectedTier ? "var(--color-bg-tertiary)" : currentSelectedTier.accentColor,
                      color: currentTier === selectedTier ? "var(--color-text-tertiary)" : "white",
                    }}
                  >
                    {currentTier === selectedTier ? (
                      <>
                        <Check className="w-4 h-4" />
                        {locale === "ka" ? "მიმდინარე გეგმა" : "Current Plan"}
                      </>
                    ) : (
                      <>
                        {locale === "ka" ? "აირჩიე გეგმა" : "Get Started"}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Benefits Panel */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {locale === "ka" ? "რას მიიღებ" : "What You Get"}
                </h3>

                <div className="space-y-4">
                  {currentSelectedTier.benefits.map((benefit, i) => {
                    const BenefitIcon = benefit.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] hover:shadow-md transition-shadow"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${currentSelectedTier.accentColor}15` }}
                        >
                          <BenefitIcon className="w-6 h-6" style={{ color: currentSelectedTier.accentColor }} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">
                            {benefit.title[locale === "ka" ? "ka" : "en"]}
                          </h4>
                          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                            {benefit.description[locale === "ka" ? "ka" : "en"]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Elite Portfolio Preview */}
                {selectedTier === "elite" && <ElitePortfolioPreview locale={locale} />}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 sm:py-20 bg-[var(--color-bg-secondary)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                {locale === "ka" ? "უსაფრთხო და სანდო" : "Safe & Trusted"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                {locale === "ka" ? "შენი უსაფრთხოება ჩვენი პრიორიტეტია" : "Your Security is Our Priority"}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: Shield, title: { en: "7-Day Guarantee", ka: "7 დღის გარანტია" }, color: "#E07B4F" },
                { icon: Lock, title: { en: "SSL Encrypted", ka: "SSL დაშიფრული" }, color: "#4A9B9B" },
                { icon: CreditCard, title: { en: "Secure Payments", ka: "უსაფრთხო გადახდა" }, color: "#6366F1" },
                { icon: RefreshCw, title: { en: "Cancel Anytime", ka: "გაუქმება ნებისმიერ დროს" }, color: "#10B981" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-center hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">
                    {item.title[locale === "ka" ? "ka" : "en"]}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
                {locale === "ka" ? "ხშირად დასმული კითხვები" : "Frequently Asked Questions"}
              </h2>
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
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 bg-[var(--color-bg-secondary)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E07B4F] to-[#D26B3F] p-8 sm:p-12 text-center text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  {locale === "ka" ? "მზად ხარ მეტი კლიენტისთვის?" : "Ready for More Clients?"}
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                  {locale === "ka"
                    ? "შეუერთდი 500+ პროფესიონალს რომლებმაც უკვე გაზარდეს თავიანთი ბიზნესი"
                    : "Join 500+ professionals who have already grown their business"}
                </p>
                <button
                  onClick={() => handleSelectPlan("pro")}
                  className="px-8 py-4 rounded-xl bg-white text-[#E07B4F] font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
                >
                  {locale === "ka" ? "დაიწყე პრო გეგმით" : "Start with Pro"}
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
