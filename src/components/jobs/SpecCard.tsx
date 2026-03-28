'use client';

import { ReactNode } from 'react';

export interface SpecCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}

export default function SpecCard({ icon, label, value, className = '' }: SpecCardProps) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 ${className}`}>
      <span className="text-neutral-400 dark:text-neutral-500 [&>svg]:w-4 [&>svg]:h-4 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
