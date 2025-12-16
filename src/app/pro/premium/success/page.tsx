'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/common/Header';
import { CheckCircle2, ArrowRight, Sparkles, Crown, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const TIER_CONFIG: Record<string, { icon: React.ElementType; name: { en: string; ka: string } }> = {
  basic: { icon: Star, name: { en: 'Premium', ka: 'პრემიუმ' } },
  pro: { icon: Zap, name: { en: 'Pro', ka: 'პრო' } },
  elite: { icon: Crown, name: { en: 'Elite', ka: 'ელიტა' } },
};

function SuccessContent() {
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const tierId = searchParams.get('tier') || 'basic';

  const tier = TIER_CONFIG[tierId] || TIER_CONFIG.basic;
  const TierIcon = tier.icon;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <Header />

      <main className="container-custom py-16 sm:py-24">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Animation */}
          <div className="relative mb-8">
            {/* Confetti particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-confetti"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 40}%`,
                    background: i % 3 === 0 ? '#D2691E' : i % 3 === 1 ? '#CD853F' : '#DEB887',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            {/* Success Icon - solid terracotta */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-[#D2691E] shadow-2xl shadow-[#D2691E]/25 mb-6 animate-scale-in">
              <TierIcon className="w-12 h-12 text-white" />
            </div>

            {/* Check badge */}
            <div className="absolute top-16 right-1/3 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg animate-bounce-in" style={{ animationDelay: '0.3s' }}>
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            {locale === 'ka' ? 'გილოცავთ!' : 'Congratulations!'}
          </h1>

          <p className="text-lg text-[var(--color-text-secondary)] mb-2">
            {locale === 'ka'
              ? `თქვენ წარმატებით გააქტიურეთ ${tier.name[locale === 'ka' ? 'ka' : 'en']} გეგმა`
              : `You've successfully activated the ${tier.name[locale === 'ka' ? 'ka' : 'en']} plan`}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-tertiary)] mb-8">
            <Sparkles className="w-4 h-4 text-[#D2691E]" />
            <span>
              {locale === 'ka'
                ? 'თქვენი პრემიუმ ფუნქციები უკვე აქტიურია'
                : 'Your premium features are now active'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pro/profile-setup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#D2691E] shadow-lg shadow-[#D2691E]/25 hover:shadow-xl hover:shadow-[#D2691E]/35 hover:-translate-y-0.5 transition-all"
            >
              {locale === 'ka' ? 'პროფილის განახლება' : 'Update Profile'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-muted)] transition-all"
            >
              {locale === 'ka' ? 'დათვალიერება' : 'Browse Jobs'}
            </Link>
          </div>

          {/* Receipt info */}
          <p className="text-xs text-[var(--color-text-tertiary)] mt-8">
            {locale === 'ka'
              ? 'ქვითარი გამოგეგზავნათ ელ-ფოსტაზე'
              : 'A receipt has been sent to your email'}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D2691E] border-t-transparent" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
