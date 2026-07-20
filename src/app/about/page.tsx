'use client';

import ConciergeIntakeModal from '@/components/landing/ConciergeIntakeModal';
import Header, { HeaderSpacer } from '@/components/common/Header';
import { FeatureCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  HelpCircle,
  Home,
  Lightbulb,
  Mail,
  Shield,
  Star,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';

// Portrait / team image that degrades to a tasteful brand-tinted icon block
// if the file at `src` is not present yet (drop real photos at the paths in
// public/about/ to replace). Keeps the page looking intentional pre-launch.
function EditorialImage({
  src,
  alt,
  fallbackIcon,
  className = '',
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  fallbackIcon: React.ReactNode;
  className?: string;
  sizes?: string;
  priority?: boolean;
}): React.ReactElement {
  const [errored, setErrored] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-[var(--hm-bg-tertiary)] ${className}`}>
      {errored ? (
        <div
          className="absolute inset-0 flex items-center justify-center text-[var(--hm-fg-muted)]"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--hm-brand-500) 6%, var(--hm-bg-tertiary))',
          }}
          aria-hidden
        >
          {fallbackIcon}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={80}
          className="object-cover"
          priority={priority}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

// Delicate centered eyebrow rule that sits above section headings - a soft
// editorial accent that reads "fancy" without adding chrome.
function SectionMark(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="mx-auto mb-5 h-px w-10 bg-gradient-to-r from-transparent via-[var(--hm-brand-500)] to-transparent"
    />
  );
}

// Soft, elegant elevation reused across the fancier surfaces.
const SOFT_SHADOW = 'shadow-[0_36px_90px_-48px_rgba(17,16,13,0.42)]';

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

      {/* Stats — one softly elevated panel with hairline dividers. */}
      <section className="relative -mt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`rounded-3xl bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] ${SOFT_SHADOW} px-6 py-9 sm:px-10`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 sm:gap-y-0">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`text-center px-2 sm:px-4 ${
                    index > 0
                      ? 'sm:border-l sm:border-[var(--hm-border-subtle)]'
                      : ''
                  }`}
                >
                  <div className="font-serif text-3xl sm:text-4xl font-medium text-[var(--hm-fg-primary)] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="mt-1.5 text-xs sm:text-sm text-[var(--hm-fg-muted)] leading-snug">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SectionMark />
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)] mb-4">
              {t('about.ourMission')}
            </h2>
            <p className="text-lg text-[var(--hm-fg-secondary)] max-w-2xl mx-auto leading-relaxed">
              {t('about.missionBlurb')}
            </p>
          </div>

        </div>
      </section>

      {/* Founder — editorial letter: portrait + signed personal story. */}
      <section className="pb-8 sm:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-14 items-center">
            {/* Portrait */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Soft brand glow for depth */}
                <div
                  aria-hidden
                  className="absolute -inset-5 -z-10 rounded-[2.5rem] opacity-70 blur-2xl"
                  style={{
                    background:
                      'radial-gradient(60% 60% at 50% 30%, color-mix(in srgb, var(--hm-brand-500) 28%, transparent), transparent 70%)',
                  }}
                />
                <EditorialImage
                  src="/about/founder.jpg"
                  alt={`${t('about.founder.name')} - ${t('about.founder.title')}, Homico`}
                  fallbackIcon={<User className="w-10 h-10" strokeWidth={1.25} />}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className={`aspect-[4/5] rounded-3xl border border-[var(--hm-border-subtle)] ${SOFT_SHADOW}`}
                />
              </div>
            </div>

            {/* Letter */}
            <div className="lg:col-span-3">
              <span className="inline-block text-xs font-medium uppercase tracking-[0.14em] text-[var(--hm-brand-500)] mb-3">
                {t('about.founder.fromFounder')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)] mb-6 tracking-tight">
                {t('about.founder.heading')}
              </h2>
              <div className="space-y-4 text-[var(--hm-fg-secondary)] leading-relaxed">
                <p>{t('about.founder.letterP1')}</p>
                <p>{t('about.founder.letterP2')}</p>
                <p>{t('about.founder.letterP3')}</p>
              </div>
              <div className="mt-6 pt-6 border-t border-[var(--hm-border-subtle)]">
                <div className="text-lg font-semibold text-[var(--hm-fg-primary)]">
                  {t('about.founder.name')}
                </div>
                <div className="text-sm text-[var(--hm-fg-muted)]">
                  {t('about.founder.title')}, Homico
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team photo band */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <SectionMark />
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)]">
              {t('about.founder.teamHeading')}
            </h2>
          </div>
          <figure>
            <EditorialImage
              src="/about/team.jpg"
              alt={t('about.founder.teamCaption')}
              fallbackIcon={<Users className="w-10 h-10" strokeWidth={1.25} />}
              sizes="(max-width: 1024px) 100vw, 1024px"
              className={`aspect-[16/9] rounded-3xl border border-[var(--hm-border-subtle)] ${SOFT_SHADOW}`}
            />
            <figcaption className="mt-4 text-center text-xs uppercase tracking-[0.14em] text-[var(--hm-fg-muted)]">
              {t('about.founder.teamCaption')}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-[var(--hm-bg-page)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <SectionMark />
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)]">
              {t('about.ourValues')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
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
          <div className="relative overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-10 sm:py-14 text-center bg-gradient-to-br from-[var(--hm-brand-500)] to-[var(--hm-brand-600)] shadow-[0_40px_100px_-45px_rgba(239,78,36,0.55)]">
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
          <SectionMark />
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
              <a href="mailto:contact@homico.co" className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                contact@homico.co
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

        </div>
      </section>

      <ConciergeIntakeModal
        isOpen={intakeOpen}
        onClose={() => setIntakeOpen(false)}
      />
    </div>
  );
}
