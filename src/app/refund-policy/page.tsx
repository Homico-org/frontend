'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, ReceiptText } from 'lucide-react';
import Link from 'next/link';

/**
 * Public refund policy page. Mirrors what the cancellation flow actually
 * enforces in code (BookingsService.computeCancellationQuote + the dispute
 * resolution rules). Update both in sync when the policy changes - the
 * in-app modal's preview is the visible enforcement, this page is the
 * legal-ish public statement.
 *
 * Structure stays single-column on purpose (no TOC) - the policy is short
 * enough that a sidebar would be visual clutter.
 */
export default function RefundPolicyPage() {
  const { t } = useLanguage();
  // Bump this when you materially change the policy. Surfaced in the hero
  // as "Last updated: ..."
  const lastUpdated = t('refundPolicy.lastUpdated');

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-brand-500)] via-[#D13C14] to-[#A92B08]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
            <ReceiptText className="w-4 h-4" strokeWidth={1.5} />
            {t('refundPolicy.eyebrow')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
            {t('refundPolicy.title')}
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-6">
            {t('refundPolicy.lead')}
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-white/50">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            {t('refundPolicy.lastUpdatedLabel')} {lastUpdated}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <article
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[var(--hm-border-subtle)] shadow-sm
            p-6 sm:p-8 lg:p-10 prose prose-neutral max-w-none
            prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-[var(--hm-fg-primary)]
            prose-h2:first:mt-0
            prose-p:text-[var(--hm-fg-secondary)] prose-p:leading-relaxed
            prose-li:text-[var(--hm-fg-secondary)] prose-li:leading-relaxed
            prose-strong:text-[var(--hm-fg-primary)] prose-strong:font-semibold
            prose-a:text-[var(--hm-brand-500)] prose-a:no-underline hover:prose-a:underline"
        >
          <h2>{t('refundPolicy.howItWorks.title')}</h2>
          <p>{t('refundPolicy.howItWorks.body')}</p>

          <h2>{t('refundPolicy.clientCancel.title')}</h2>
          <p>{t('refundPolicy.clientCancel.intro')}</p>
          <ul>
            <li>
              <strong>{t('refundPolicy.clientCancel.rule24h.label')}:</strong>{' '}
              {t('refundPolicy.clientCancel.rule24h.body')}
            </li>
            <li>
              <strong>{t('refundPolicy.clientCancel.rule2h.label')}:</strong>{' '}
              {t('refundPolicy.clientCancel.rule2h.body')}
            </li>
            <li>
              <strong>{t('refundPolicy.clientCancel.ruleLate.label')}:</strong>{' '}
              {t('refundPolicy.clientCancel.ruleLate.body')}
            </li>
          </ul>

          <h2>{t('refundPolicy.proCancel.title')}</h2>
          <p>{t('refundPolicy.proCancel.body')}</p>

          <h2>{t('refundPolicy.completion.title')}</h2>
          <p>{t('refundPolicy.completion.body')}</p>
          <ul>
            <li>{t('refundPolicy.completion.bullet1')}</li>
            <li>{t('refundPolicy.completion.bullet2')}</li>
            <li>{t('refundPolicy.completion.bullet3')}</li>
          </ul>

          <h2>{t('refundPolicy.disputes.title')}</h2>
          <p>{t('refundPolicy.disputes.body')}</p>
          <ul>
            <li>{t('refundPolicy.disputes.bullet1')}</li>
            <li>{t('refundPolicy.disputes.bullet2')}</li>
            <li>{t('refundPolicy.disputes.bullet3')}</li>
            <li>{t('refundPolicy.disputes.bullet4')}</li>
          </ul>

          <h2>{t('refundPolicy.timing.title')}</h2>
          <p>{t('refundPolicy.timing.body')}</p>

          <h2>{t('refundPolicy.changes.title')}</h2>
          <p>{t('refundPolicy.changes.body')}</p>

          <h2>{t('refundPolicy.contact.title')}</h2>
          <p>
            {t('refundPolicy.contact.body')}{' '}
            <Link href="/help">{t('refundPolicy.contact.helpLink')}</Link>.
          </p>
        </article>
      </div>
    </div>
  );
}
