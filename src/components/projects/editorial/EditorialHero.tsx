'use client';

import { ReactNode } from 'react';

interface EditorialHeroProps {
  /** Mono caps taxonomy line with leading 28×1 rule */
  eyebrow: string;
  /** Italic Fraunces display title (40-56px), max-width clamps the wrap */
  title: ReactNode;
  /** 13px muted caption shown under the title */
  caption?: ReactNode;
  /** Big tabular figure on the right (desktop only) */
  figure?: ReactNode;
  /** Italic light unit suffix next to the figure */
  unit?: ReactNode;
}

/**
 * Paper canonical `4ND-0` (homico-design-system §17).
 * Left rail: 28×1 rule + mono eyebrow + italic display title + optional caption.
 * Right side: optional big Fraunces tabular numeral + italic light unit (sm+).
 * Used by Materials and Library tab heroes.
 */
export function EditorialHero({
  eyebrow,
  title,
  caption,
  figure,
  unit,
}: EditorialHeroProps) {
  return (
    <header className="flex items-end justify-between gap-8 border-b border-[var(--hm-n-200)] pb-10">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-4">
          <span aria-hidden className="block h-px w-7 bg-[var(--hm-n-900)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--hm-n-500)]">
            {eyebrow}
          </span>
        </div>
        <h2 className="mt-1.5 max-w-[24ch] font-display text-[13px] font-bold italic leading-[1.25] tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[14px]">
          {title}
        </h2>
        {caption != null && (
          <p className="mt-3 text-[12px] text-[var(--hm-n-500)]">{caption}</p>
        )}
      </div>
      {figure != null && (
        <div className="hidden shrink-0 items-baseline gap-1 sm:flex">
          <span className="font-display text-[15px] font-bold leading-[0.95] tracking-[-0.02em] tabular-nums text-[var(--hm-n-900)]">
            {figure}
          </span>
          {unit != null && (
            <span className="font-display text-[9px] italic font-light text-[var(--hm-n-500)]">
              {unit}
            </span>
          )}
        </div>
      )}
    </header>
  );
}
