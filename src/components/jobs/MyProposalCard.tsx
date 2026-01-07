'use client';

import { CheckCircle2 } from 'lucide-react';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';
import { formatCurrency } from '@/utils/currencyUtils';

export interface Proposal {
  _id: string;
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
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
}

export default function MyProposalCard({
  proposal,
  locale = 'en',
  className = '',
}: MyProposalCardProps) {
  const getStatusText = () => {
    switch (proposal.status) {
      case 'pending':
        return locale === 'ka' ? 'განხილვაში' : 'Pending';
      case 'accepted':
        return locale === 'ka' ? 'გაგზავნილი' : 'Submitted';
      case 'rejected':
        return locale === 'ka' ? 'უარყოფილი' : 'Rejected';
      case 'withdrawn':
        return locale === 'ka' ? 'გაუქმებული' : 'Withdrawn';
      default:
        return proposal.status;
    }
  };

  const getStatusColor = () => {
    switch (proposal.status) {
      case 'pending':
        return 'text-amber-600 dark:text-amber-400';
      case 'accepted':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'rejected':
      case 'withdrawn':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  const getDurationLabel = () => {
    switch (proposal.estimatedDurationUnit) {
      case 'days':
        return locale === 'ka' ? 'დღე' : 'days';
      case 'weeks':
        return locale === 'ka' ? 'კვირა' : 'weeks';
      case 'months':
        return locale === 'ka' ? 'თვე' : 'months';
      default:
        return '';
    }
  };

  return (
    <section
      className={`bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-6 md:p-8 border border-emerald-200/50 dark:border-emerald-800/50 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
            {locale === 'ka' ? 'თქვენი შეთავაზება' : 'Your Proposal'}
          </h3>
          <span
            className={`text-xs font-body font-medium uppercase tracking-wider ${getStatusColor()}`}
          >
            {getStatusText()}
          </span>
        </div>
      </div>

      <p className="font-body text-neutral-600 dark:text-neutral-300 mb-4">
        {proposal.coverLetter}
      </p>

      {(proposal.proposedPrice || proposal.estimatedDuration) && (
        <div className="flex gap-6">
          {proposal.proposedPrice && (
            <div>
              <p className="text-xs font-body text-neutral-500 dark:text-neutral-400">
                {locale === 'ka' ? 'ფასი' : 'Price'}
              </p>
              <p
                className="font-display text-xl font-semibold"
                style={{ color: ACCENT }}
              >
                {formatCurrency(proposal.proposedPrice)}
              </p>
            </div>
          )}
          {proposal.estimatedDuration && (
            <div>
              <p className="text-xs font-body text-neutral-500 dark:text-neutral-400">
                {locale === 'ka' ? 'ვადა' : 'Duration'}
              </p>
              <p className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
                {proposal.estimatedDuration} {getDurationLabel()}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
