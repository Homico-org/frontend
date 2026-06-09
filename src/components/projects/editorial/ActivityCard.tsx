'use client';

import { ReactNode } from 'react';

interface ActivityCardProps {
  /** Mono caps role context shown at top-left */
  role: string;
  /** Mono caps relative timestamp shown at top-right */
  timestamp: string;
  /** Actor name - rendered bold inside the description */
  actor: string;
  /** Activity copy that follows the actor name */
  description: ReactNode;
}

/**
 * Paper canonical `7BM-0` (homico-design-system §17).
 * White card, 1px hairline border, rounded 18px.
 * Header: mono caps role left + mono caps timestamp right.
 * Body: 14px copy with actor name bold + muted description.
 * Used by Overview Activity Strip (3 cards in a row).
 */
export function ActivityCard({
  role,
  timestamp,
  actor,
  description,
}: ActivityCardProps) {
  return (
    <div className="rounded-[18px] border border-[var(--hm-n-200)] bg-[var(--hm-bg-elevated)] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--hm-n-500)]">
          {role}
        </span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--hm-n-400)]">
          {timestamp}
        </span>
      </div>
      <p className="mt-4 text-[14px] leading-[1.5] text-[var(--hm-n-900)]">
        <span className="font-semibold">{actor}</span>{' '}
        <span className="text-[var(--hm-n-700)]">{description}</span>
      </p>
    </div>
  );
}
