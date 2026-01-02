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
      className={`flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 ${className}`}
    >
      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        {icon}
      </div>
      <span className="font-body text-sm text-neutral-700 dark:text-neutral-300">
        {text}
      </span>
    </div>
  );
}
