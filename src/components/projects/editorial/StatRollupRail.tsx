'use client';

import { ReactNode } from 'react';

export interface StatRollupMetric {
  /** Mono caps label above the figure */
  label: string;
  /** Hero figure - tabular-nums Plus Jakarta 36px */
  figure: ReactNode;
  /** Italic light unit suffix next to the figure */
  unit?: ReactNode;
  /** When true, the figure renders in sage (net-positive metric) instead of ink */
  positive?: boolean;
}

interface StatRollupRailProps {
  metrics: StatRollupMetric[];
}

/**
 * Paper canonical `4MM-0` (homico-design-system §17).
 * 4-metric strip with hairline borders top + bottom and vertical 1px rules
 * between columns. Each column: mono caps label + 36px tabular figure + italic
 * light unit. Use `positive: true` to tint the figure sage for surplus/savings.
 * Used by Overview metric strip, Materials hero, Library hero.
 */
export function StatRollupRail({ metrics }: StatRollupRailProps) {
  return (
    <div className="flex flex-col border-y border-[var(--hm-n-200)] py-5 sm:flex-row">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`flex flex-1 flex-col justify-between gap-3 border-b border-[var(--hm-n-200)] py-2 sm:border-b-0 ${
            i > 0 ? 'sm:border-l sm:pl-8' : ''
          } ${i < metrics.length - 1 ? 'sm:pr-8' : ''}`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--hm-n-500)]">
            {m.label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-display text-[18px] font-bold leading-none tracking-[-0.02em] tabular-nums sm:text-[20px] ${
                m.positive ? 'text-[var(--hm-success-500)]' : 'text-[var(--hm-n-900)]'
              }`}
            >
              {m.figure}
            </span>
            {m.unit != null && (
              <span className="font-display text-[10px] italic font-light text-[var(--hm-n-500)] sm:text-[12px]">
                {m.unit}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
