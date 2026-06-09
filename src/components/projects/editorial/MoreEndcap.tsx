'use client';

import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface MoreEndcapBaseProps {
  /** "+N more" mono caps eyebrow */
  count: string;
  onClick?: () => void;
}

interface MoreEndcapDarkProps extends MoreEndcapBaseProps {
  variant?: 'dark';
  /** Stacked italic names (line breaks rendered as <br/>) */
  lines: string[];
}

interface MoreEndcapWarmProps extends MoreEndcapBaseProps {
  variant: 'warm';
  /** One-line italic editorial copy */
  title: string;
  /** Mono caps action label */
  actionLabel: string;
}

type MoreEndcapProps = MoreEndcapDarkProps | MoreEndcapWarmProps;

/**
 * Paper canonical `5M0-0` dark / `5M3-0` warm (homico-design-system §17).
 * Dark variant: ink fill, white type, 1/1 square, stacked italic names.
 * Warm variant: #F5F2EB bg with hairline, italic editorial line, mono action link.
 * Used by Selections / Shopping / gallery overflow endcaps.
 */
export function MoreEndcap(props: MoreEndcapProps) {
  if (props.variant === 'warm') {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className="group flex flex-col gap-2.5 border border-[var(--hm-n-200)] bg-[var(--hm-bg-tertiary)] p-4 text-left transition-colors hover:bg-[var(--hm-bg-elevated)]"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--hm-n-500)]">
          {props.count}
        </span>
        <span className="font-display text-[22px] font-bold italic leading-tight tracking-[-0.02em] text-[var(--hm-n-900)] sm:text-[24px]">
          {props.title}
        </span>
        <span className="inline-flex items-center gap-1.5 pt-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-n-900)]">
          {props.actionLabel}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="group flex aspect-square flex-col justify-between bg-[var(--hm-n-900)] p-3.5 text-left text-white transition-transform hover:-translate-y-0.5"
    >
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#FAFAF7]">
        {props.count}
      </span>
      <span className="font-display text-[24px] font-bold italic leading-[1.07] tracking-[-0.02em] sm:text-[28px]">
        {props.lines.map((line, i) => (
          <span key={i} className="block">
            {line}
            {i < props.lines.length - 1 ? ',' : '.'}
          </span>
        ))}
      </span>
    </button>
  );
}
