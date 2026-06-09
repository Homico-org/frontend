'use client';

import { ArrowRight } from 'lucide-react';

interface EditorialEmptyStateProps {
  /** Mono caps eyebrow (optional - omit for an "anonymous" empty fold) */
  eyebrow?: string;
  /** Italic Fraunces title - the editorial sentence that owns the void */
  title: string;
  /** Square ghost button label (optional) */
  ctaLabel?: string;
  /** Square ghost button onClick (paired with ctaLabel) */
  onCta?: () => void;
  /** When true, top/bottom hairline borders are rendered (used inside a stack) */
  bordered?: boolean;
}

/**
 * Paper canonical pattern (homico-design-system §6, anti-slop rule).
 * NEVER icon-in-circle empty states. Always: eyebrow + italic title + vermillion
 * ghost button, left-aligned, owning generous white space.
 * Used by Team / Timeline / Materials empty sections.
 */
export function EditorialEmptyState({
  eyebrow,
  title,
  ctaLabel,
  onCta,
  bordered = false,
}: EditorialEmptyStateProps) {
  return (
    <section
      className={`flex flex-col gap-5 py-8 ${
        bordered ? 'border-y border-[var(--hm-n-200)] py-16' : ''
      }`}
    >
      {eyebrow && (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--hm-n-500)]">
          {eyebrow}
        </span>
      )}
      <h3 className="max-w-[28ch] font-display text-[13px] font-bold italic leading-[1.25] tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[14px]">
        {title}
      </h3>
      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-2 inline-flex w-fit items-center gap-2 border border-[var(--hm-brand-500)] px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-brand-500)] transition-colors hover:bg-[var(--hm-brand-500)] hover:text-white"
        >
          {ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </section>
  );
}
