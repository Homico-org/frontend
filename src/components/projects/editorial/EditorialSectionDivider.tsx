'use client';

import { ReactNode } from 'react';

interface EditorialSectionDividerProps {
  /** 2-character mono index like "01" */
  index: string;
  /** Section title - rendered italic Fraunces */
  title: string;
  /** Right-side count or stamp - mono caps */
  count?: ReactNode;
  /** When false, drops the top hairline (use at the start of a stack) */
  divider?: boolean;
}

/**
 * Paper canonical `4MB-0` (homico-design-system §17).
 * Top ink border + mono index + Fraunces italic title + mono caps count on the right.
 * Used by Materials sub-sections, Library sub-sections, Team phase headers.
 */
export function EditorialSectionDivider({
  index,
  title,
  count,
  divider = true,
}: EditorialSectionDividerProps) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        divider ? 'border-t border-[var(--hm-n-900)] pt-5' : ''
      }`}
    >
      <div className="flex items-baseline gap-3.5">
        <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--hm-n-500)]">
          {index}
        </span>
        <h3 className="font-display text-[11px] font-bold italic tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[12px]">
          {title}
        </h3>
      </div>
      {count != null && (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--hm-n-500)]">
          {count}
        </span>
      )}
    </div>
  );
}
