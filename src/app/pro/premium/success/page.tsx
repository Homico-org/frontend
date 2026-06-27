'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnalyticsEvent, useAnalytics } from '@/hooks/useAnalytics';
import { useCountryLink } from '@/hooks/useCountry';
import { formatPremiumDate, premiumTierName } from '@/utils/premium';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Crown,
  Eye,
  Star,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Benefit = { icon: React.ElementType; text: Record<'en' | 'ka' | 'ru', string> };

// What each tier unlocks. Page content (marketing copy), so it carries its
// own en/ka/ru rather than going through the i18n JSON.
const TIER_BENEFITS: Record<string, Benefit[]> = {
  basic: [
    { icon: BadgeCheck, text: { en: 'Premium badge on your profile', ka: 'პრემიუმ ბეჯი პროფილზე', ru: 'Премиум-бейдж в профиле' } },
    { icon: TrendingUp, text: { en: 'Priority placement in search', ka: 'პრიორიტეტული ადგილი ძიებაში', ru: 'Приоритет в поиске' } },
    { icon: Eye, text: { en: '2x more profile views', ka: '2x მეტი ნახვა', ru: '2x больше просмотров' } },
  ],
  pro: [
    { icon: BadgeCheck, text: { en: 'Pro badge on your profile', ka: 'პრო ბეჯი პროფილზე', ru: 'Pro-бейдж в профиле' } },
    { icon: TrendingUp, text: { en: 'Top of search results', ka: 'ტოპ პოზიცია ძიებაში', ru: 'Топ результатов поиска' } },
    { icon: Eye, text: { en: '5x more profile views', ka: '5x მეტი ნახვა', ru: '5x больше просмотров' } },
    { icon: Star, text: { en: 'Featured on the homepage', ka: 'მთავარ გვერდზე გამოჩენა', ru: 'На главной странице' } },
  ],
  elite: [
    { icon: Crown, text: { en: 'Elite badge on your profile', ka: 'ელიტ ბეჯი პროფილზე', ru: 'Элитный бейдж в профиле' } },
    { icon: TrendingUp, text: { en: '#1 in search results', ka: '#1 ძიების შედეგებში', ru: '#1 в результатах поиска' } },
    { icon: Eye, text: { en: '10x more profile views', ka: '10x მეტი ნახვა', ru: '10x больше просмотров' } },
    { icon: UserCog, text: { en: 'A personal account manager', ka: 'პერსონალური მენეჯერი', ru: 'Персональный менеджер' } },
  ],
};

type Phase =
  | { kind: 'confirming' }
  | { kind: 'active'; tier: string; expiresAt?: string }
  | { kind: 'inactive' };

function SuccessContent() {
  const { t, pick, locale } = useLanguage();
  const { refreshUser } = useAuth();
  const { trackEvent } = useAnalytics();
  const cl = useCountryLink();
  const search = useSearchParams();
  const hintedTier = search.get('tier') || undefined;

  const [phase, setPhase] = useState<Phase>({ kind: 'confirming' });

  // Pull the REAL premium state from the server. The return page only routes
  // here after the charge cleared, but the in-memory user may predate the
  // grant - so refresh, then trust the server's tier, never the URL param.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await refreshUser();
      if (cancelled) return;
      if (fresh?.isPremium && fresh.premiumTier && fresh.premiumTier !== 'none') {
        setPhase({ kind: 'active', tier: fresh.premiumTier, expiresAt: fresh.premiumExpiresAt });
      } else {
        setPhase({ kind: 'inactive' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  useEffect(() => {
    if (phase.kind === 'active') {
      trackEvent(AnalyticsEvent.PREMIUM_SUCCESS, { planType: phase.tier });
    }
  }, [phase, trackEvent]);

  // --- Confirming -------------------------------------------------------
  if (phase.kind === 'confirming') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-[15px] text-[var(--hm-fg-muted)]">
          {t('premium.confirmingSubscription')}
        </p>
      </div>
    );
  }

  // --- No active subscription (direct nav / payment not reflected) -------
  if (phase.kind === 'inactive') {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
          <Crown className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
            {t('premium.noActiveSubTitle')}
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--hm-fg-muted)]">
            {t('premium.noActiveSubBody')}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={cl('/pro/premium')}>
            {t('premium.viewPlans')}
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </Button>
      </div>
    );
  }

  // --- Active: editorial confirmation -----------------------------------
  const tier = phase.tier;
  const tierName = premiumTierName(tier, pick) || pick({ en: 'Premium', ka: 'პრემიუმ', ru: 'Premium' });
  const benefits = TIER_BENEFITS[tier] || TIER_BENEFITS.basic;
  const expiryLabel = formatPremiumDate(phase.expiresAt, locale);

  return (
    <div className="mx-auto max-w-xl px-5 py-16 sm:py-20">
      {/* Confirmation mark - one calm accent, no gradient/glow/confetti */}
      <div className="mb-8 flex items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--hm-success-500)]/[0.1] text-[var(--hm-success-600)] ring-1 ring-[var(--hm-success-500)]/20">
          <BadgeCheck className="h-8 w-8" strokeWidth={1.75} />
        </div>
      </div>

      {/* Eyebrow + headline */}
      <div className="text-center">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--hm-fg-muted)]">
          {t('premium.activatedEyebrow')}
        </p>
        <h1 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[40px]">
          {t('premium.congratulations')}
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-[var(--hm-fg-secondary)]">
          {pick({
            en: `Your ${tierName} plan is live. Here's what's now working for you.`,
            ka: `${tierName} გეგმა აქტიურია. აი, რა მუშაობს ახლა თქვენთვის.`,
            ru: `Тариф ${tierName} активен. Вот что теперь работает на вас.`,
          })}
        </p>
      </div>

      {/* Plan + expiry stamp */}
      <div className="mt-8 flex flex-col items-center gap-3 border-y border-[var(--hm-border-subtle)] py-5 sm:flex-row sm:justify-center sm:gap-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--hm-fg-primary)]">
          <Crown className="h-4 w-4 text-[var(--hm-brand-500)]" strokeWidth={1.75} />
          {tierName} {t('premium.plan')}
        </span>
        {expiryLabel && (
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--hm-fg-muted)]">
            {t('premium.activeUntilStamp')} · {expiryLabel}
          </span>
        )}
      </div>

      {/* Benefits - hairline list, not tinted cards */}
      <div className="mt-8">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--hm-fg-muted)]">
          {t('premium.planIncludes')}
        </p>
        <ul className="divide-y divide-[var(--hm-border-subtle)]">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <li key={i} className="flex items-center gap-3.5 py-3.5">
                <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--hm-brand-500)]" strokeWidth={1.75} />
                <span className="flex-1 text-[15px] text-[var(--hm-fg-primary)]">
                  {pick(b.text)}
                </span>
                <Check className="h-4 w-4 shrink-0 text-[var(--hm-success-500)]" strokeWidth={2.25} />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link href="/pro/profile-setup">
            {t('premium.updateYourProfile')}
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="flex-1">
          <Link href={cl('/jobs')}>{t('premium.browseJobs')}</Link>
        </Button>
      </div>

      {/* Receipt */}
      <p className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-[var(--hm-fg-muted)]">
        <Check className="h-3.5 w-3.5 text-[var(--hm-success-500)]" strokeWidth={2.25} />
        {t('premium.aReceiptHasBeenSent')}
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
        <HeaderSpacer />
        <main>
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <SuccessContent />
          </Suspense>
        </main>
      </div>
    </AuthGuard>
  );
}
