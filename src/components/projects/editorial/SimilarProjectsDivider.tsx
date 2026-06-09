'use client';

import { ArrowRight } from 'lucide-react';

interface SimilarProjectsDividerProps {
  /** Mono caps eyebrow on top */
  eyebrow: string;
  /** Italic Fraunces closing line */
  title: string;
  /** Square ghost button label */
  ctaLabel: string;
  /** Square ghost button click handler */
  onCta: () => void;
}

/**
 * Paper canonical `4ZS-0` (homico-design-system §17, pattern P9).
 * Hairline top border + 14px mono caps eyebrow + 28-40px italic Fraunces title
 * + square ghost button on the right that hover-fills ink.
 * Used as the closing fold of every project tab.
 */
export function SimilarProjectsDivider({
  eyebrow,
  title,
  ctaLabel,
  onCta,
}: SimilarProjectsDividerProps) {
  return (
    <section className="border-t border-[var(--hm-n-200)] pt-14">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--hm-n-500)]">
            {eyebrow}
          </span>
          <h2 className="mt-1.5 max-w-[36ch] font-display text-[12px] font-bold italic leading-[1.3] tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[14px]">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCta}
          className="inline-flex shrink-0 items-center gap-2 border border-[var(--hm-n-900)] px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-n-900)] transition-colors hover:bg-[var(--hm-n-900)] hover:text-white"
        >
          {ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
}
