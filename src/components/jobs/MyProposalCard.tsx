'use client';

import { formatCurrency } from '@/utils/currencyUtils';

import { useLanguage } from "@/contexts/LanguageContext";
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
  const statusConfig = {
    pending: {
      label: t('common.pending'),
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    accepted: {
      label: t('common.accepted'),
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
    rejected: {
      label: t('common.rejected'),
      bg: 'bg-red-50 dark:bg-red-500/10',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-500',
    },
    withdrawn: {
      label: t('job.withdrawn'),
      bg: 'bg-neutral-100 dark:bg-neutral-500/10',
      text: 'text-neutral-600 dark:text-neutral-400',
      dot: 'bg-neutral-400',
    },
  };

  const status = statusConfig[proposal.status] || statusConfig.pending;

  const getDurationLabel = () => {
    const units = {
      days: t('jobs.d3'),
      weeks: t('jobs.w3'),
      months: t('job.mo'),
    };
    return units[proposal.estimatedDurationUnit || 'days'] || '';
  };

  return (
    <section
      className={`group relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden transition-all duration-300 hover:border-[#C4735B]/30 hover:shadow-lg hover:shadow-[#C4735B]/5 ${className}`}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C4735B] via-[#D4846C] to-[#C4735B]" />

      <div className="p-5">
        {/* Header: Title + Status */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            {/* Terracotta icon */}
            <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#C4735B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('job.yourProposal')}
            </span>
          </div>

          {/* Status pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
            <span className={`text-[11px] font-medium ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Metrics row */}
        {(proposal.proposedPrice || proposal.estimatedDuration) && (
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            {proposal.proposedPrice && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {t('common.price')}
                  </p>
                  <p className="text-base font-bold text-[#C4735B]">
                    {formatCurrency(proposal.proposedPrice)}
                  </p>
                </div>
              </div>
            )}

            {proposal.proposedPrice && proposal.estimatedDuration && (
              <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
            )}

            {proposal.estimatedDuration && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {t('common.duration')}
                  </p>
                  <p className="text-base font-bold text-neutral-900 dark:text-white">
                    {proposal.estimatedDuration}{getDurationLabel()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cover letter */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#C4735B]/40 via-[#C4735B]/20 to-transparent rounded-full" />
          <p className="pl-3.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-3">
            {proposal.coverLetter}
          </p>
        </div>
      </div>
    </section>
  );
}
