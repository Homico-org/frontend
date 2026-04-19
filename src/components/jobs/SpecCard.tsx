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
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--hm-bg-tertiary)]/50 ${className}`}>
      <span className="text-[var(--hm-fg-muted)] [&>svg]:w-4 [&>svg]:h-4 flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-[var(--hm-fg-muted)] uppercase tracking-wider leading-none mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-[var(--hm-fg-primary)] truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
