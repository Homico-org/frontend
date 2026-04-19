'use client';

import { ReactNode } from 'react';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';

export interface JobStatsBarProps {
  /** Budget display string (e.g., "₾5,000" or "₾1,000 - ₾5,000") */
  budget?: string | null;
  /** Number of views */
  viewCount: number;
  /** Number of proposals */
  proposalCount: number;
  /** Budget label text */
  budgetLabel?: string;
  /** Views label text */
  viewsLabel?: string;
  /** Proposals label text */
  proposalsLabel?: string;
  /** Actions to display on the right side */
  actions?: ReactNode;
  /** Animation state for entry */
  isVisible?: boolean;
  /** Custom className */
  className?: string;
}

export default function JobStatsBar({
  budget,
  viewCount,
  proposalCount,
  budgetLabel = 'Budget',
  viewsLabel = 'Views',
  proposalsLabel = 'Proposals',
  actions,
  isVisible = true,
  className = '',
}: JobStatsBarProps) {
  return (
    <div
      className={`relative bg-[var(--hm-bg-elevated)] rounded-2xl shadow-xl shadow-black/5 p-4 md:p-6 border border-[var(--hm-border-subtle)] transition-all duration-700 delay-400 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Budget */}
        {budget && (
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${ACCENT}15` }}
            >
              <span
                className="font-body text-xl font-bold"
                style={{ color: ACCENT }}
              >
                ₾
              </span>
            </div>
            <div>
              <p className="text-xs font-body font-medium text-[var(--hm-fg-muted)] uppercase tracking-wider">
                {budgetLabel}
              </p>
              <p className="text-xl md:text-2xl font-body font-bold text-[var(--hm-fg-primary)] tabular-nums">
                {budget}
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        {budget && (
          <div className="hidden md:block w-px h-12 bg-[var(--hm-n-200)]" />
        )}

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-body font-bold text-[var(--hm-fg-primary)] tabular-nums">
              {viewCount}
            </p>
            <p className="text-xs font-body text-[var(--hm-fg-muted)]">
              {viewsLabel}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-body font-bold text-[var(--hm-fg-primary)] tabular-nums">
              {proposalCount}
            </p>
            <p className="text-xs font-body text-[var(--hm-fg-muted)]">
              {proposalsLabel}
            </p>
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <>
            <div className="hidden md:block w-px h-12 bg-[var(--hm-n-200)]" />
            {actions}
          </>
        )}
      </div>
    </div>
  );
}
