'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowRight,
  Check,
  CheckCircle,
  ClipboardCheck,
  MessageSquare,
  PenSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type UserType = 'client' | 'pro';

export default function HowItWorksPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<UserType>('client');

  const clientSteps = [
    {
      number: 1,
      titleKey: 'howItWorks.clientStep1Title',
      descriptionKey: 'howItWorks.clientStep1Description',
      icon: <PenSquare className="w-8 h-8" />,
    },
    {
      number: 2,
      titleKey: 'howItWorks.clientStep2Title',
      descriptionKey: 'howItWorks.clientStep2Description',
      icon: <MessageSquare className="w-8 h-8" />,
    },
    {
      number: 3,
      titleKey: 'howItWorks.clientStep3Title',
      descriptionKey: 'howItWorks.clientStep3Description',
      icon: <ClipboardCheck className="w-8 h-8" />,
    },
    {
      number: 4,
      titleKey: 'howItWorks.clientStep4Title',
      descriptionKey: 'howItWorks.clientStep4Description',
      icon: <CheckCircle className="w-8 h-8" />,
    },
    {
      number: 5,
      titleKey: 'howItWorks.clientStep5Title',
      descriptionKey: 'howItWorks.clientStep5Description',
      icon: <Sparkles className="w-8 h-8" />,
    },
  ];

  const proSteps = [
    {
      number: 1,
      titleKey: 'howItWorks.proStep1Title',
      descriptionKey: 'howItWorks.proStep1Description',
      icon: <User className="w-8 h-8" />,
    },
    {
      number: 2,
      titleKey: 'howItWorks.proStep2Title',
      descriptionKey: 'howItWorks.proStep2Description',
      icon: <ShieldCheck className="w-8 h-8" />,
    },
    {
      number: 3,
      titleKey: 'howItWorks.proStep3Title',
      descriptionKey: 'howItWorks.proStep3Description',
      icon: <Search className="w-8 h-8" />,
    },
    {
      number: 4,
      titleKey: 'howItWorks.proStep4Title',
      descriptionKey: 'howItWorks.proStep4Description',
      icon: <Send className="w-8 h-8" />,
    },
    {
      number: 5,
      titleKey: 'howItWorks.proStep5Title',
      descriptionKey: 'howItWorks.proStep5Description',
      icon: <Star className="w-8 h-8" />,
    },
  ];

  const benefits = {
    client: [
      {
        titleKey: 'howItWorks.clientBenefit1Title',
        descriptionKey: 'howItWorks.clientBenefit1Description',
      },
      {
        titleKey: 'howItWorks.clientBenefit2Title',
        descriptionKey: 'howItWorks.clientBenefit2Description',
      },
      {
        titleKey: 'howItWorks.clientBenefit3Title',
        descriptionKey: 'howItWorks.clientBenefit3Description',
      },
    ],
    pro: [
      {
        titleKey: 'howItWorks.proBenefit1Title',
        descriptionKey: 'howItWorks.proBenefit1Description',
      },
      {
        titleKey: 'howItWorks.proBenefit2Title',
        descriptionKey: 'howItWorks.proBenefit2Description',
      },
      {
        titleKey: 'howItWorks.proBenefit3Title',
        descriptionKey: 'howItWorks.proBenefit3Description',
      },
    ],
  };

  const steps = activeTab === 'client' ? clientSteps : proSteps;
  const currentBenefits = activeTab === 'client' ? benefits.client : benefits.pro;

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-brand-500)] via-[var(--hm-brand-600)] to-[var(--hm-brand-700)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              {t('howItWorks.simpleFast')}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
              {t('howItWorks.howDoesHomicoWork')}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
              {t('howItWorks.findTrustedProfessionalsOrGet')}
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex p-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('client')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'client'
                    ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-brand-500)] shadow-lg hover:bg-[var(--hm-bg-elevated)] hover:text-[var(--hm-brand-500)]'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {t('howItWorks.forClients')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('pro')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'pro'
                    ? 'bg-[var(--hm-bg-elevated)] text-[var(--hm-brand-500)] shadow-lg hover:bg-[var(--hm-bg-elevated)] hover:text-[var(--hm-brand-500)]'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {t('howItWorks.forProfessionals')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 sm:space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col sm:flex-row items-start gap-6 ${
                  index % 2 === 1 ? 'sm:flex-row-reverse' : ''
                }`}
              >
                {/* Step Number & Icon */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--hm-brand-500)] to-[var(--hm-brand-700)] flex items-center justify-center text-white shadow-lg shadow-[var(--hm-brand-500)]/20">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--hm-bg-elevated)] shadow-md flex items-center justify-center">
                      <span className="text-sm font-bold text-[var(--hm-brand-500)]">{step.number}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 ${index % 2 === 1 ? 'sm:text-right' : ''}`}>
                  <h3 className="text-xl font-semibold text-[var(--hm-fg-primary)] mb-2">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-[var(--hm-fg-secondary)] leading-relaxed">
                    {t(step.descriptionKey)}
                  </p>
                </div>

                {/* Connector Line (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 h-8 w-px bg-gradient-to-b from-[var(--hm-brand-500)]/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-[var(--hm-bg-page)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-center text-[var(--hm-fg-primary)] mb-12">
            {activeTab === 'client'
              ? (t('howItWorks.whyChooseHomico'))
              : (t('howItWorks.whyJoinHomico'))}
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {currentBenefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-[var(--hm-bg-elevated)] rounded-2xl p-6 border border-[var(--hm-border-subtle)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--hm-brand-500)]/10 flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-[var(--hm-brand-500)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-2">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-sm text-[var(--hm-fg-secondary)]">
                  {t(benefit.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)] mb-4">
            {activeTab === 'client'
              ? (t('howItWorks.readyToGetStarted'))
              : (t('howItWorks.joinUsToday'))}
          </h2>
          <p className="text-[var(--hm-fg-secondary)] mb-8">
            {activeTab === 'client'
              ? (t('howItWorks.postYourProjectAndReceive'))
              : (t('howItWorks.createYourProfileAndStart'))}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={activeTab === 'client' ? '/post-job' : '/register/professional'}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[var(--hm-brand-500)] to-[var(--hm-brand-700)] text-white font-medium shadow-lg shadow-[var(--hm-brand-500)]/20 hover:shadow-xl hover:shadow-[var(--hm-brand-500)]/30 transition-all hover:scale-105"
            >
              {activeTab === 'client'
                ? (t('howItWorks.postAProject'))
                : (t('howItWorks.registerAsPro'))}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] font-medium hover:bg-[var(--hm-border)] transition-all"
            >
              {t('howItWorks.browseProfessionals')}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-8 border-t border-[var(--hm-border-subtle)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[var(--hm-fg-secondary)]">
            {t('howItWorks.haveQuestions')}{' '}
            <Link href="/help" className="text-[var(--hm-brand-500)] hover:underline font-medium">
              {t('howItWorks.checkOurFaq')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
