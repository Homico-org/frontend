'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { StatCard, FeatureCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Mail, HelpCircle, Shield, Star, Users, Lightbulb } from 'lucide-react';

// Note: For SEO, metadata is defined in layout.tsx for this route

export default function AboutPage() {
  const { t } = useLanguage();

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
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B] via-[#B8654D] to-[#A85A45]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {t('about.aboutUs')}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-6 tracking-tight">
              {t('about.connectingPeopleWithTheBest')}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
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
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white mb-4">
              {t('about.ourMission')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {t('about.missionBlurb')}
            </p>
          </div>

          {/* Story */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-8 border border-neutral-100 dark:border-dark-border">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              {t('about.ourStory')}
            </h3>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                {t('about.homicoWasBornFromA')}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                {t('about.weDecidedToCreateA')}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('about.todayHomicoConnectsThousandsOf')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-elevated">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-center text-neutral-900 dark:text-white mb-12">
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

      {/* Contact Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white mb-4">
            {t('about.getInTouch')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
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

          <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-dark-border">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('about.tbilisiGeorgia')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <section className="py-8 border-t border-neutral-100 dark:border-dark-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm">
            <Link href="/terms" className="text-neutral-600 dark:text-neutral-400 hover:text-[#C4735B] transition-colors">
              {t('about.termsOfService')}
            </Link>
            <Link href="/privacy" className="text-neutral-600 dark:text-neutral-400 hover:text-[#C4735B] transition-colors">
              {t('about.privacyPolicy')}
            </Link>
            <Link href="/how-it-works" className="text-neutral-600 dark:text-neutral-400 hover:text-[#C4735B] transition-colors">
              {t('about.howItWorks')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
