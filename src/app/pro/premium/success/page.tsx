'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnalyticsEvent, useAnalytics } from '@/hooks/useAnalytics';
import {
    ArrowRight,
    BadgeCheck,
    CheckCircle2,
    Crown,
    Eye,
    Gem,
    Gift, Share2,
    Sparkles,
    Star,
    TrendingUp,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

// Luxurious color palette
const COLORS = {
  gold: "#D4AF37",
  goldDark: "#B8962F",
  terracotta: "#C4735B",
  terracottaDark: "#A85D4A",
};

const TIER_CONFIG: Record<string, { 
  icon: React.ElementType; 
  name: { en: string; ka: string };
  color: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  benefits: { icon: React.ElementType; text: { en: string; ka: string } }[];
}> = {
  basic: { 
    icon: Star, 
    name: { en: 'Premium', ka: 'პრემიუმ' },
    color: '#4A9B9B',
    gradientFrom: '#4A9B9B',
    gradientTo: '#3D8585',
    glowColor: 'rgba(74, 155, 155, 0.4)',
    benefits: [
      { icon: BadgeCheck, text: { en: 'Premium Badge Active', ka: 'პრემიუმ ბეჯი აქტიურია' } },
      { icon: TrendingUp, text: { en: 'Priority Search Enabled', ka: 'პრიორიტეტული ძიება ჩართულია' } },
      { icon: Eye, text: { en: '2x Profile Visibility', ka: '2x მეტი ხილვადობა' } },
    ],
  },
  pro: { 
    icon: Zap, 
    name: { en: 'Pro', ka: 'პრო' },
    color: COLORS.terracotta,
    gradientFrom: COLORS.terracotta,
    gradientTo: COLORS.terracottaDark,
    glowColor: 'rgba(196, 115, 91, 0.4)',
    benefits: [
      { icon: BadgeCheck, text: { en: 'Pro Badge Active', ka: 'პრო ბეჯი აქტიურია' } },
      { icon: TrendingUp, text: { en: 'Top Search Results', ka: 'ტოპ ძიების შედეგები' } },
      { icon: Eye, text: { en: '5x Profile Visibility', ka: '5x მეტი ხილვადობა' } },
      { icon: Sparkles, text: { en: 'Featured on Homepage', ka: 'მთავარ გვერდზე გამოჩენა' } },
    ],
  },
  elite: { 
    icon: Gem, 
    name: { en: 'Elite', ka: 'ელიტა' },
    color: COLORS.gold,
    gradientFrom: COLORS.gold,
    gradientTo: COLORS.goldDark,
    glowColor: 'rgba(212, 175, 55, 0.5)',
    benefits: [
      { icon: Crown, text: { en: 'Elite Gold Badge Active', ka: 'ელიტა ოქროს ბეჯი აქტიურია' } },
      { icon: TrendingUp, text: { en: '#1 in Search Results', ka: '#1 ძიების შედეგებში' } },
      { icon: Eye, text: { en: '10x Profile Visibility', ka: '10x მეტი ხილვადობა' } },
      { icon: Gift, text: { en: 'Personal Manager Assigned', ka: 'პერსონალური მენეჯერი დანიშნული' } },
    ],
  },
};

function SuccessContent() {
  const { t, locale } = useLanguage();
  const { trackEvent } = useAnalytics();
  const searchParams = useSearchParams();
  const tierId = searchParams.get("tier") || 'basic';
  const [isVisible, setIsVisible] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  const tier = TIER_CONFIG[tierId] || TIER_CONFIG.basic;
  const TierIcon = tier.icon;
  const isElite = tierId === 'elite';

  useEffect(() => {
    setIsVisible(true);
    // Stagger benefits animation
    const timer = setTimeout(() => setShowBenefits(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    trackEvent(AnalyticsEvent.PREMIUM_SUCCESS, {
      planType: tierId,
    });
  }, [trackEvent, tierId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        @keyframes scale-bounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes check-bounce {
          0% { transform: scale(0) translateX(50%); opacity: 0; }
          60% { transform: scale(1.3) translateX(50%); }
          100% { transform: scale(1) translateX(50%); opacity: 1; }
        }
        
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
        }
        
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        .animate-scale-bounce {
          animation: scale-bounce 0.6s ease-out forwards;
        }
        
        .animate-check-bounce {
          animation: check-bounce 0.5s ease-out forwards;
        }
        
        .animate-confetti {
          animation: confetti-fall 2s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <Header />
      <HeaderSpacer />

      <main className={`relative py-16 sm:py-24 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-30"
            style={{ background: `radial-gradient(circle, ${tier.color}40 0%, transparent 70%)` }}
          />
          
          {/* Floating sparkles for elite */}
          {isElite && [...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            >
              <Sparkles className="text-amber-400/30" style={{ width: `${12 + Math.random() * 8}px` }} />
            </div>
          ))}
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          {/* Success Animation */}
          <div className="relative mb-10">
            {/* Confetti particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full animate-confetti"
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    top: '0%',
                    background: i % 4 === 0 
                      ? tier.color 
                      : i % 4 === 1 
                        ? COLORS.gold 
                        : i % 4 === 2 
                          ? '#10B981' 
                          : '#8B5CF6',
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: `${1.5 + Math.random() * 1}s`,
                  }}
                />
              ))}
            </div>

            {/* Main Success Icon */}
            <div className="relative inline-block">
              {/* Glow ring */}
              <div 
                className="absolute -inset-4 rounded-full blur-xl animate-glow"
                style={{ background: tier.glowColor }}
              />
              
              <div 
                className="relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl animate-scale-bounce"
                style={{ 
                  background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                  boxShadow: `0 20px 60px ${tier.glowColor}`,
                }}
              >
                <TierIcon className="w-14 h-14 text-white" />
              </div>

              {/* Check badge */}
              <div 
                className="absolute -top-2 right-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg animate-check-bounce"
                style={{ animationDelay: '0.4s' }}
              >
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 
            className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white mb-4"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {t('premium.congratulations')}
          </h1>

          <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-3">
            {locale === 'ka'
              ? `თქვენ წარმატებით გააქტიურეთ`
              : `You've successfully activated the`}
          </p>
          
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-lg mb-8 shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
              boxShadow: `0 8px 32px ${tier.glowColor}`,
            }}
          >
            <TierIcon className="w-5 h-5" />
            {tier.name[locale === 'ka' ? 'ka' : 'en']} {t('premium.plan')}
          </div>

          {/* Benefits Card */}
          <div 
            className={`bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200/50 dark:border-neutral-700 shadow-xl mb-10 transition-all duration-700 ${
              showBenefits ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-6">
              {t('premium.yourNewBenefits')}
            </h2>
            
            <div className="space-y-4">
              {tier.benefits.map((benefit, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all animate-slide-up"
                  style={{ 
                    background: `${tier.color}08`,
                    animationDelay: `${0.7 + i * 0.1}s`,
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: `linear-gradient(135deg, ${tier.gradientFrom}20, ${tier.gradientTo}10)`,
                    }}
                  >
                    <benefit.icon className="w-6 h-6" style={{ color: tier.color }} />
                  </div>
                  <span className="text-left font-medium text-neutral-700 dark:text-neutral-200">
                    {benefit.text[locale === 'ka' ? 'ka' : 'en']}
                  </span>
                  <CheckCircle2 className="w-5 h-5 ml-auto flex-shrink-0 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/pro/profile-setup"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                boxShadow: `0 12px 40px ${tier.glowColor}`,
              }}
            >
              {/* Shine effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {t('premium.updateYourProfile')}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/browse/jobs"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
            >
              {t('premium.browseJobs')}
            </Link>
          </div>

          {/* Share */}
          <div className="flex items-center justify-center gap-2 text-neutral-400 mb-8">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">
              {t('premium.shareWithYourColleagues')}
            </span>
          </div>

          {/* Receipt info */}
          <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              {t('premium.aReceiptHasBeenSent')}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-white">
          <div className="flex flex-col items-center gap-6">
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center animate-pulse shadow-2xl"
              style={{ 
                background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.terracottaDark})`,
              }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <LoadingSpinner size="lg" color={COLORS.terracotta} />
          </div>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </AuthGuard>
  );
}
