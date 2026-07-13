'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountryLink } from '@/hooks/useCountry';

interface ToolCTAProps {
  /**
   * Optional query passed to /post-job so a tool can pre-seed the job (e.g. the
   * Prices tool sending the browsed category). Kept generic - the post-job page
   * reads what it understands and ignores the rest.
   */
  postJobQuery?: string;
  className?: string;
}

/**
 * Shared conversion banner for the research tools (analyzer, compare, prices).
 * The tools attract users pricing a renovation; this turns that intent into a
 * posted job / a browse-pros visit instead of dead-ending on a result screen.
 */
export function ToolCTA({ postJobQuery, className = '' }: ToolCTAProps) {
  const { t } = useLanguage();
  const cl = useCountryLink();
  const postJobHref = cl(`/post-job${postJobQuery ? `?${postJobQuery}` : ''}`);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[var(--hm-brand-500)]/20 bg-gradient-to-br from-[var(--hm-brand-500)]/10 to-[var(--hm-brand-500)]/5 p-5 sm:p-6 ${className}`}
    >
      <h3 className="text-lg sm:text-xl font-bold text-[var(--hm-fg-primary)]">
        {t('tools.cta.title')}
      </h3>
      <p className="mt-1 text-sm text-[var(--hm-fg-secondary)] max-w-xl">
        {t('tools.cta.subtitle')}
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <Link
          href={postJobHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--hm-brand-500)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--hm-brand-500)]/25 transition-all hover:bg-[var(--hm-brand-600)] hover:shadow-[var(--hm-brand-500)]/40"
        >
          {t('tools.cta.postJob')}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
        <Link
          href={cl('/professionals')}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--hm-border-strong)] bg-[var(--hm-bg-elevated)] px-5 py-3 text-sm font-semibold text-[var(--hm-fg-primary)] transition-colors hover:border-[var(--hm-brand-500)]/40"
        >
          {t('tools.cta.browsePros')}
        </Link>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--hm-fg-muted)]">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
        {t('tools.cta.trust')}
      </p>
    </div>
  );
}

export default ToolCTA;
