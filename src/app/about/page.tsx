'use client';

import ConciergeIntakeModal from '@/components/landing/ConciergeIntakeModal';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { StatCard, FeatureCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import {
  ArrowRight,
  HelpCircle,
  Home,
  Lightbulb,
  Mail,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';

// Note: For SEO, metadata is defined in layout.tsx for this route

export default function AboutPage(): React.ReactElement {
  const { t } = useLanguage();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const openIntake = useCallback((): void => setIntakeOpen(true), []);

  const stats = [
    {
      value: t('about.stats.professionalsValue'),
      label: t('about.stats.professionalsLabel'),
    },
    {
      value: t('about.stats.categoriesValue'),
      label: t('about.stats.categoriesLabel'),
    },
    {
      value: t('about.stats.serviceAreaValue'),
      label: t('about.stats.serviceAreaLabel'),
    },
    {
      value: t('about.stats.supportValue'),
      label: t('about.stats.supportLabel'),
    },
  ];

  const values = [
    {
      title: t('about.values.trustTransparency.title'),
      description: t('about.values.trustTransparency.description'),
      icon: <Shield className="w-5 h-5" />,
    },
    {
      title: t('about.values.qualityFirst.title'),
      description: t('about.values.qualityFirst.description'),
      icon: <Star className="w-5 h-5" />,
    },
    {
      title: t('about.values.communityFocus.title'),
      description: t('about.values.communityFocus.description'),
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: t('about.values.innovation.title'),
      description: t('about.values.innovation.description'),
      icon: <Lightbulb className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      {/* Hero Section — subtle brand tint on page background (dark-mode safe). */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,78,36,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,78,36,0.04),transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <span
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-medium mb-6"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--hm-brand-500) 10%, transparent)',
                borderColor:
                  'color-mix(in srgb, var(--hm-brand-500) 20%, transparent)',
                color: 'var(--hm-brand-500)',
              }}
            >
              <Home className="w-4 h-4" strokeWidth={1.5} />
              {t('about.aboutUs')}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-[var(--hm-fg-primary)] mb-6 tracking-tight">
              {t('about.connectingPeopleWithTheBest')}
            </h1>
            <p className="text-base sm:text-lg text-[var(--hm-fg-secondary)] max-w-2xl mx-auto leading-relaxed">
              {t('about.heroBlurb')}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)] mb-4">
              {t('about.ourMission')}
            </h2>
            <p className="text-lg text-[var(--hm-fg-secondary)] max-w-2xl mx-auto leading-relaxed">
              {t('about.missionBlurb')}
            </p>
          </div>

          {/* Story */}
          <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-8 border border-[var(--hm-border-subtle)]">
            <h3 className="text-xl font-semibold text-[var(--hm-fg-primary)] mb-4">
              {t('about.ourStory')}
            </h3>
            <div className="prose prose-neutral max-w-none">
              <p className="text-[var(--hm-fg-secondary)] leading-relaxed mb-4">
                {t('about.homicoWasBornFromA')}
              </p>
              <p className="text-[var(--hm-fg-secondary)] leading-relaxed mb-4">
                {t('about.weDecidedToCreateA')}
              </p>
              <p className="text-[var(--hm-fg-secondary)] leading-relaxed">
                {t('about.todayHomicoConnectsThousandsOf')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-[var(--hm-bg-page)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-center text-[var(--hm-fg-primary)] mb-12">
            {t('about.ourValues')}
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <FeatureCard
                key={index}
                title={value.title}
                description={value.description}
                icon={value.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Concierge CTA — convert interest before the page ends. */}
      <section className="py-10 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-12 text-center bg-gradient-to-br from-[var(--hm-brand-500)] to-[var(--hm-brand-600)]">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-white mb-3">
                {t('about.ctaTitle')}
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto mb-6">
                {t('about.ctaSubtitle')}
              </p>
              <Button
                size="lg"
                onClick={openIntake}
                className="h-11 px-6 text-sm font-semibold bg-[var(--hm-bg-elevated)] text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] shadow-lg inline-flex items-center gap-2"
              >
                {t('concierge.requestQuote')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)] mb-4">
            {t('about.getInTouch')}
          </h2>
          <p className="text-[var(--hm-fg-secondary)] mb-8">
            {t('about.contactBlurb')}
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Button
              variant="premium"
              size="lg"
              asChild
            >
              <a href="mailto:info@homico.ge" className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                info@homico.ge
              </a>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              asChild
            >
              <Link href="/help" className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {t('about.helpCenter')}
              </Link>
            </Button>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--hm-border-subtle)]">
            <p className="text-sm text-[var(--hm-fg-muted)]">
              {t('about.tbilisiGeorgia')}
            </p>
          </div>
        </div>
      </section>

      <ConciergeIntakeModal
        isOpen={intakeOpen}
        onClose={() => setIntakeOpen(false)}
      />
    </div>
  );
}
