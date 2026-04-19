'use client';

import { ReactNode } from 'react';

export interface RequirementBadgeProps {
  /** Icon to display */
  icon: ReactNode;
  /** Text label */
  text: string;
  /** Custom className */
  className?: string;
}

export default function RequirementBadge({ icon, text, className = '' }: RequirementBadgeProps) {
  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--hm-success-50)]/10 border border-emerald-100 ${className}`}
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[var(--hm-success-500)]/20 flex items-center justify-center text-[var(--hm-success-500)] flex-shrink-0">
        {icon}
      </div>
      <span className="font-body text-xs sm:text-sm text-[var(--hm-fg-secondary)]">
        {text}
      </span>
    </div>
  );
}
