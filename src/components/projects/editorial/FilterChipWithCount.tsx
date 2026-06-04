'use client';

import { ReactNode } from 'react';

interface FilterChipWithCountProps {
  label: ReactNode;
  count?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

/**
 * Paper canonical `532-0` default / `535-0` active (homico-design-system §17).
 * Default: 1px hairline border, ink label, muted count.
 * Active: ink fill, white label, paper-tinted count.
 * Square corners (8/14 padding, 8px gap).
 * Used by Materials room filter, Library category filter.
 */
export function FilterChipWithCount({
  label,
  count,
  active = false,
  onClick,
}: FilterChipWithCountProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium transition-colors ${
        active
          ? 'bg-[var(--hm-n-900)] font-semibold text-white'
          : 'border border-[var(--hm-n-200)] text-[var(--hm-n-900)] hover:border-[var(--hm-n-900)]'
      }`}
    >
      <span>{label}</span>
      {count != null && (
        <span
          className={`font-mono text-[10px] tabular-nums ${
            active ? 'text-white/80' : 'text-[var(--hm-n-500)]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
