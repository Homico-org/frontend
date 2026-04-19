'use client';

import { formatCurrency } from '@/utils/currencyUtils';

import { useLanguage } from "@/contexts/LanguageContext";
import { StatusPill } from '@/components/ui/StatusPill';
export interface Proposal {
  id: string;
  coverLetter: string;
  proposedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: 'days' | 'weeks' | 'months';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

export interface MyProposalCardProps {
  /** The proposal data */
  proposal: Proposal;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

export default function MyProposalCard({
  proposal,
  locale = 'en',
  className = '',
}: MyProposalCardProps) {
  const { t } = useLanguage();
  const statusLabelKeys: Record<Proposal['status'], string> = {
    pending: 'common.pending',
    accepted: 'common.accepted',
    rejected: 'common.rejected',
    withdrawn: 'job.withdrawn',
  };

  const getDurationLabel = () => {
    const units = {
      days: t("timeUnits.day"),
      weeks: t("timeUnits.week"),
      months: t('job.mo'),
    };
    return units[proposal.estimatedDurationUnit || 'days'] || '';
  };

  return (
    <section
      className={`group relative bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl border border-[var(--hm-border-subtle)] overflow-hidden transition-all duration-300 hover:border-[var(--hm-brand-500)]/30 hover:shadow-lg hover:shadow-[var(--hm-brand-500)]/5 ${className}`}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--hm-brand-500)] via-[#F06B43] to-[var(--hm-brand-500)]" />

      <div className="p-4 sm:p-5">
        {/* Header: Title + Status */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Terracotta icon */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[var(--hm-brand-500)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--hm-brand-500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-[var(--hm-fg-primary)]">
              {t('job.yourProposal')}
            </span>
          </div>

          <StatusPill
            variant={proposal.status}
            size="sm"
            locale={locale}
            label={t(statusLabelKeys[proposal.status])}
          />
        </div>

        {/* Metrics row */}
        {(proposal.proposedPrice || proposal.estimatedDuration) && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-[var(--hm-border-subtle)]">
            {proposal.proposedPrice && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--hm-fg-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)]">
                    {t('common.price')}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-[var(--hm-brand-500)]">
                    {formatCurrency(proposal.proposedPrice)}
                  </p>
                </div>
              </div>
            )}

            {proposal.proposedPrice && proposal.estimatedDuration && (
              <div className="hidden sm:block w-px h-8 bg-[var(--hm-n-200)]" />
            )}

            {proposal.estimatedDuration && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--hm-fg-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[var(--hm-fg-muted)]">
                    {t('common.duration')}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-[var(--hm-fg-primary)]">
                    {proposal.estimatedDuration}{getDurationLabel()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cover letter */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--hm-brand-500)]/40 via-[var(--hm-brand-500)]/20 to-transparent rounded-full" />
          <p className="pl-3 sm:pl-3.5 text-xs sm:text-[13px] leading-relaxed text-[var(--hm-fg-secondary)] line-clamp-3">
            {proposal.coverLetter}
          </p>
        </div>
      </div>
    </section>
  );
}
