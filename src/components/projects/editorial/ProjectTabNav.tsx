'use client';

import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

export interface ProjectTab {
  id: string;
  label: ReactNode;
  /** Optional count badge shown in mono caps next to the label */
  count?: number;
}

interface ProjectTabNavProps {
  tabs: ProjectTab[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Optional right-side helper button (mono caps + arrow) */
  trailing?: {
    label: ReactNode;
    onClick: () => void;
  };
}

/**
 * Paper canonical `4O2-0` (homico-design-system §17).
 * Sticky top nav with mono caps tab labels + count badges. Active tab gets
 * ink color + 2px ink underline. Right-side trailing slot for a helper action.
 * Used by the project page top-level nav (Overview / Team / Timeline /
 * Materials / Library).
 */
export function ProjectTabNav({
  tabs,
  activeId,
  onSelect,
  trailing,
}: ProjectTabNavProps) {
  return (
    <div className="sticky top-0 z-[var(--hm-z-raised)] mb-5 flex items-center justify-between gap-4 border-b border-[var(--hm-n-200)] bg-[var(--hm-bg-elevated)] px-1 shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 sm:gap-x-5">
        {tabs.map((tb) => {
          const isActive = activeId === tb.id;
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => onSelect(tb.id)}
              className={`relative -mb-px py-2.5 text-[12px] font-medium tracking-[-0.005em] transition-colors ${
                isActive
                  ? 'text-[var(--hm-n-900)]'
                  : 'text-[var(--hm-n-500)] hover:text-[var(--hm-n-700)]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {tb.label}
                {tb.count != null && (
                  <span
                    className={`font-mono text-[9px] font-semibold tabular-nums ${
                      isActive ? 'text-[var(--hm-brand-500)]' : 'text-[var(--hm-n-300)]'
                    }`}
                  >
                    {tb.count}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--hm-brand-500)]" />
              )}
            </button>
          );
        })}
      </div>
      {trailing && (
        <button
          type="button"
          onClick={trailing.onClick}
          className="hidden items-center gap-1 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--hm-n-500)] hover:text-[var(--hm-n-900)] sm:inline-flex"
        >
          {trailing.label}
          <ArrowRight className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}
