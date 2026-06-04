'use client';

import { ReactNode } from 'react';

interface PhaseGroupHeaderProps {
  /** 2-character mono index like "01" */
  index: string;
  /** Italic Fraunces phase name */
  name: string;
  /** Mono caps right-side count or progress label */
  meta?: ReactNode;
}

/**
 * Paper canonical `7BX-0` (homico-design-system §17).
 * Ink 1px top border, mono index + italic 28px phase name on the left,
 * mono caps count/progress on the right.
 * Used by Team artboard 4× (Design / Permits / Construction / Finishing).
 */
export function PhaseGroupHeader({ index, name, meta }: PhaseGroupHeaderProps) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-[var(--hm-n-900)] pt-5">
      <div className="flex items-baseline gap-3.5">
        <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--hm-n-900)]">
          {index}
        </span>
        <h3 className="font-display text-[11px] font-bold italic tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[12px]">
          {name}
        </h3>
      </div>
      {meta != null && (
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--hm-n-500)]">
          {meta}
        </span>
      )}
    </div>
  );
}
