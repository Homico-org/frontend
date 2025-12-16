'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/common/Header';
import { Check, Crown, Sparkles, Star, Zap, Shield, TrendingUp, Award, Clock, MessageCircle, Eye, BadgeCheck, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  gradient: string;
  glowColor: string;
  borderColor: string;
  features: PremiumFeature[];
  popular: boolean;
}

// Premium tier configuration - using solid terracotta color
const PREMIUM_TIERS: Record<string, PremiumTier> = {
  basic: {
    id: 'basic',
    name: { en: 'Premium', ka: 'პრემიუმ' },
    tagline: { en: 'Stand out from the crowd', ka: 'გამოირჩიე სხვებისგან' },
    price: { monthly: 29, yearly: 290 },
    currency: '₾',
    icon: Star,
    gradient: '', // Using solid color instead
    glowColor: 'rgba(210, 105, 30, 0.2)',
    borderColor: 'rgba(210, 105, 30, 0.25)',
    features: [
      { icon: BadgeCheck, text: { en: 'Premium Badge on Profile', ka: 'პრემიუმ ბეჯი პროფილზე' } },
      { icon: TrendingUp, text: { en: 'Priority in Search Results', ka: 'პრიორიტეტი ძიების შედეგებში' } },
      { icon: Eye, text: { en: '2x More Profile Views', ka: '2x მეტი პროფილის ნახვა' } },
      { icon: MessageCircle, text: { en: 'Direct Messaging to Clients', ka: 'პირდაპირი შეტყობინებები' } },
      { icon: Clock, text: { en: 'Analytics Dashboard', ka: 'ანალიტიკის პანელი' } },
    ],
    popular: false,
  },
  pro: {
    id: 'pro',
    name: { en: 'Pro', ka: 'პრო' },
    tagline: { en: 'For serious professionals', ka: 'სერიოზული პროფესიონალებისთვის' },
    price: { monthly: 59, yearly: 590 },
    currency: '₾',
    icon: Zap,
    gradient: '', // Using solid color instead
    glowColor: 'rgba(210, 105, 30, 0.25)',
    borderColor: 'rgba(210, 105, 30, 0.35)',
    features: [
      { icon: BadgeCheck, text: { en: 'Everything in Premium', ka: 'ყველაფერი პრემიუმიდან' }, included: true },
      { icon: Crown, text: { en: 'Pro Badge & Verification', ka: 'პრო ბეჯი და ვერიფიკაცია' } },
      { icon: TrendingUp, text: { en: 'Top Search Placement', ka: 'ტოპ პოზიცია ძიებაში' } },
      { icon: Eye, text: { en: '5x More Profile Views', ka: '5x მეტი პროფილის ნახვა' } },
      { icon: Sparkles, text: { en: 'Featured on Homepage', ka: 'მთავარ გვერდზე გამოჩენა' } },
      { icon: Shield, text: { en: 'Priority Support', ka: 'პრიორიტეტული მხარდაჭერა' } },
      { icon: Award, text: { en: 'Unlimited Portfolio Items', ka: 'შეუზღუდავი პორტფოლიო' } },
    ],
    popular: true,
  },
  elite: {
    id: 'elite',
    name: { en: 'Elite', ka: 'ელიტა' },
    tagline: { en: 'Maximum visibility & trust', ka: 'მაქსიმალური ხილვადობა' },
    price: { monthly: 99, yearly: 990 },
    currency: '₾',
    icon: Crown,
    gradient: '', // Using solid color instead
    glowColor: 'rgba(210, 105, 30, 0.3)',
    borderColor: 'rgba(210, 105, 30, 0.4)',
    features: [
      { icon: BadgeCheck, text: { en: 'Everything in Pro', ka: 'ყველაფერი პრო-დან' }, included: true },
      { icon: Crown, text: { en: 'Elite Gold Badge', ka: 'ელიტა ოქროს ბეჯი' } },
      { icon: TrendingUp, text: { en: '#1 Search Priority', ka: '#1 ძიების პრიორიტეტი' } },
      { icon: Eye, text: { en: '10x More Profile Views', ka: '10x მეტი ნახვა' } },
      { icon: Sparkles, text: { en: 'Exclusive Homepage Spotlight', ka: 'ექსკლუზიური სპოტლაითი' } },
      { icon: Shield, text: { en: 'Dedicated Account Manager', ka: 'პერსონალური მენეჯერი' } },
      { icon: MessageCircle, text: { en: 'WhatsApp/Viber Support', ka: 'WhatsApp/Viber მხარდაჭერა' } },
      { icon: Award, text: { en: 'Custom Profile Design', ka: 'პერსონალური დიზაინი' } },
    ],
    popular: false,
  },
};

type BillingPeriod = 'monthly' | 'yearly';

// FAQ Component with smooth accordion
function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="premium-faq-item-v2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 px-6 text-left"
      >
        <span className="font-medium text-[var(--color-text-primary)] leading-relaxed">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-48' : 'max-h-0'}`}
      >
        <p className="px-6 pb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const isPro = user?.role === 'pro';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentTier = (user as any)?.proProfile?.premiumTier || 'none';

  const handleSelectPlan = (tierId: string) => {
    if (!isAuthenticated) {
      router.push('/register?redirect=/pro/premium');
      return;
    }
    if (!isPro) {
      router.push('/become-pro?redirect=/pro/premium');
      return;
    }
    router.push(`/pro/premium/checkout?tier=${tierId}&period=${billingPeriod}`);
  };

  const faqs = [
    {
      q: { en: 'Can I upgrade or downgrade my plan?', ka: 'შემიძლია გეგმის შეცვლა?' },
      a: { en: 'Yes! You can upgrade or downgrade at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the credit will be applied to future billing.', ka: 'დიახ! შეგიძლია გეგმის შეცვლა ნებისმიერ დროს. გაუმჯობესებისას გადაიხდი სხვაობას, ხოლო დაქვეითებისას კრედიტი გადაინაცვლებს მომავალ გადახდაზე.' }
    },
    {
      q: { en: 'What payment methods do you accept?', ka: 'რა გადახდის მეთოდებს იღებთ?' },
      a: { en: 'We accept all major credit/debit cards, Bank of Georgia, TBC Bank, and Liberty Bank transfers.', ka: 'ვიღებთ ყველა ძირითად საკრედიტო/სადებეტო ბარათს, საქართველოს ბანკს, თიბისი ბანკს და ლიბერთი ბანკის გადარიცხვებს.' }
    },
    {
      q: { en: 'How does the 7-day guarantee work?', ka: 'როგორ მუშაობს 7 დღიანი გარანტია?' },
      a: { en: 'If you\'re not satisfied within the first 7 days, contact us and we\'ll refund 100% of your payment. No questions asked.', ka: 'თუ პირველი 7 დღის განმავლობაში არ ხარ კმაყოფილი, დაგვიკავშირდი და დაგიბრუნებთ 100%-ს. ყოველგვარი კითხვის გარეშე.' }
    },
    {
      q: { en: 'When will I see results?', ka: 'როდის ვნახავ შედეგებს?' },
      a: { en: 'Most professionals see increased profile views and client inquiries within the first week of upgrading.', ka: 'პროფესიონალების უმეტესობა ხედავს პროფილის ნახვების და კლიენტების მოთხოვნების ზრდას პირველივე კვირაში.' }
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <Header />

      <main className="relative overflow-hidden">
        {/* Background with subtle terracotta accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle terracotta orbs */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#D2691E]/10 blur-[120px]" />
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-[#D2691E]/8 blur-[100px]" />
            <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-[#D2691E]/10 blur-[80px]" />
          </div>

          {/* Floating decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 border border-[#D2691E]/10 rounded-full animate-float-slow" />
          <div className="absolute bottom-32 left-16 w-20 h-20 border border-[#D2691E]/8 rounded-2xl rotate-45 animate-float-slower" />
        </div>

        <div className="relative container-custom py-12 sm:py-16 lg:py-24">
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            {/* Refined Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8 premium-badge-glow">
              <div className="relative">
                <Sparkles className="w-4 h-4 text-[#D2691E]" />
                <div className="absolute inset-0 animate-ping-slow">
                  <Sparkles className="w-4 h-4 text-[#D2691E]/50" />
                </div>
              </div>
              <span className="text-sm font-semibold text-[#D2691E] dark:text-[#CD853F]">
                {locale === 'ka' ? 'გაზარდე შენი შესაძლებლობები' : 'Unlock Your Full Potential'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] mb-6 tracking-tight leading-[1.1]">
              {locale === 'ka' ? (
                <>
                  გახდი{' '}
                  <span className="relative">
                    <span className="premium-text-gradient-terracotta">პრემიუმ</span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                      <path d="M2 10C50 4 150 4 198 10" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                          <stop stopColor="#8B4513"/>
                          <stop offset="0.5" stopColor="#D2691E"/>
                          <stop offset="1" stopColor="#CD853F"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                  <br />პროფესიონალი
                </>
              ) : (
                <>
                  Become a{' '}
                  <span className="relative inline-block">
                    <span className="premium-text-gradient-terracotta">Premium</span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                      <path d="M2 10C50 4 150 4 198 10" stroke="url(#underline-gradient2)" strokeWidth="3" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="underline-gradient2" x1="0" y1="0" x2="200" y2="0">
                          <stop stopColor="#8B4513"/>
                          <stop offset="0.5" stopColor="#D2691E"/>
                          <stop offset="1" stopColor="#CD853F"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                  <br />Professional
                </>
              )}
            </h1>

            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              {locale === 'ka'
                ? 'მიიღე მეტი კლიენტი, გაზარდე შენი ხილვადობა და გამოირჩიე კონკურენტებისგან.'
                : 'Get more clients, increase your visibility, and stand out from the competition.'}
            </p>
          </div>

          {/* Refined Billing Toggle - terracotta */}
          <div className="flex items-center justify-center mb-14">
            <div className="inline-flex items-center gap-1 p-1.5 rounded-full premium-toggle-container">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  billingPeriod === 'monthly'
                    ? 'text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {billingPeriod === 'monthly' && (
                  <div className="absolute inset-0 rounded-full bg-[#D2691E] shadow-lg shadow-[#D2691E]/25" />
                )}
                <span className="relative z-10">{locale === 'ka' ? 'თვიური' : 'Monthly'}</span>
              </button>

              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  billingPeriod === 'yearly'
                    ? 'text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {billingPeriod === 'yearly' && (
                  <div className="absolute inset-0 rounded-full bg-[#D2691E] shadow-lg shadow-[#D2691E]/25" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {locale === 'ka' ? 'წლიური' : 'Yearly'}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm">
                    -17%
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Premium Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto pt-6">
            {Object.values(PREMIUM_TIERS).map((tier, index) => {
              const TierIcon = tier.icon;
              const isCurrentPlan = currentTier === tier.id;
              const price = tier.price[billingPeriod];

              return (
                <div
                  key={tier.id}
                  className={`premium-card-v2 group relative animate-fade-in-up ${tier.popular ? 'premium-card-popular-terracotta' : ''}`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    ['--glow-color' as string]: tier.glowColor,
                    ['--border-color' as string]: tier.borderColor,
                  }}
                >
                  {/* Popular Badge - solid terracotta */}
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#D2691E] blur-md opacity-40 rounded-full" />
                        <div className="relative px-4 py-1.5 rounded-full bg-[#D2691E] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#D2691E]/25 whitespace-nowrap">
                          {locale === 'ka' ? '⚡ პოპულარული' : '⚡ Most Popular'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative p-8 pt-10">
                    {/* Card Header */}
                    <div className="text-center mb-8">
                      {/* Icon with glow - solid terracotta */}
                      <div className="relative inline-flex mb-5">
                        <div
                          className="absolute inset-0 rounded-2xl blur-xl opacity-40 transition-opacity duration-300 group-hover:opacity-60 bg-[#D2691E]"
                        />
                        <div
                          className="relative w-16 h-16 rounded-2xl flex items-center justify-center bg-[#D2691E] shadow-xl shadow-[#D2691E]/25"
                        >
                          <TierIcon className="w-8 h-8 text-white drop-shadow-sm" />
                        </div>
                      </div>

                      {/* Name & Tagline */}
                      <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                        {tier.name[locale === 'ka' ? 'ka' : 'en']}
                      </h3>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {tier.tagline[locale === 'ka' ? 'ka' : 'en']}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="text-center mb-8 pb-8 border-b border-[var(--color-border)]/50">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-[var(--color-text-primary)] tracking-tight">
                          {tier.currency}{price}
                        </span>
                        <span className="text-base text-[var(--color-text-tertiary)] font-medium">
                          /{billingPeriod === 'monthly' ? (locale === 'ka' ? 'თვე' : 'mo') : (locale === 'ka' ? 'წელი' : 'yr')}
                        </span>
                      </div>
                      {billingPeriod === 'yearly' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="text-xs font-semibold">
                            {locale === 'ka' ? `დაზოგე ${tier.currency}${tier.price.monthly * 12 - price}` : `Save ${tier.currency}${tier.price.monthly * 12 - price}`}
                          </span>
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
                            className={`flex items-start gap-3 ${feature.included ? 'opacity-60' : ''}`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
                              feature.included
                                ? 'bg-[var(--color-bg-tertiary)]'
                                : 'bg-[#D2691E] shadow-sm shadow-[#D2691E]/20'
                            }`}>
                              {feature.included ? (
                                <Check className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                              ) : (
                                <FeatureIcon className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                            <span className={`text-sm leading-relaxed ${
                              feature.included
                                ? 'text-[var(--color-text-tertiary)] italic'
                                : 'text-[var(--color-text-secondary)]'
                            }`}>
                              {feature.text[locale === 'ka' ? 'ka' : 'en']}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* CTA Button - solid terracotta */}
                    <button
                      onClick={() => handleSelectPlan(tier.id)}
                      disabled={isCurrentPlan}
                      className={`
                        premium-cta-btn w-full py-4 px-6 rounded-2xl font-semibold text-sm transition-all duration-300
                        ${isCurrentPlan
                          ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                          : tier.popular
                            ? 'bg-[#D2691E] text-white shadow-lg shadow-[#D2691E]/25 hover:shadow-xl hover:shadow-[#D2691E]/35 hover:-translate-y-0.5'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'
                        }
                      `}
                    >
                      {isCurrentPlan
                        ? (locale === 'ka' ? '✓ მიმდინარე გეგმა' : '✓ Current Plan')
                        : (locale === 'ka' ? 'აირჩიე გეგმა' : 'Choose Plan')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Section */}
          <div className="mt-16 sm:mt-20 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
            {[
              { icon: Shield, text: locale === 'ka' ? '7 დღის გარანტია' : '7-day guarantee' },
              { icon: () => (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ), text: locale === 'ka' ? 'უსაფრთხო გადახდა' : 'Secure payment' },
              { icon: () => (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12l2 2 4-4"/>
                </svg>
              ), text: locale === 'ka' ? 'გაუქმება ნებისმიერ დროს' : 'Cancel anytime' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[var(--color-text-tertiary)]">
                <item.icon className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-24 max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">
                {locale === 'ka' ? 'ხშირად დასმული კითხვები' : 'Frequently Asked Questions'}
              </h2>
              <p className="text-[var(--color-text-tertiary)]">
                {locale === 'ka' ? 'პასუხები გავრცელებულ კითხვებზე' : 'Answers to common questions'}
              </p>
            </div>

            <div className="premium-faq-container">
              {faqs.map((faq, i) => (
                <FAQItem
                  key={i}
                  question={faq.q[locale === 'ka' ? 'ka' : 'en']}
                  answer={faq.a[locale === 'ka' ? 'ka' : 'en']}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
