'use client';

import { ReactNode } from 'react';

export interface SpecCardProps {
  /** Icon to display */
  icon: ReactNode;
  /** Label text (shown above value) */
  label: string;
  /** Value to display */
  value: string;
  /** Custom className */
  className?: string;
}

export default function SpecCard({ icon, label, value, className = '' }: SpecCardProps) {
  return (
    <div
      className={`group p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50 hover:border-neutral-200 dark:hover:border-neutral-600 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 mb-2 text-neutral-400 dark:text-neutral-500">
        {icon}
        <span className="font-body text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
