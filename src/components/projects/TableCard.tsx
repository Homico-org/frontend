'use client';

import { ReactNode } from 'react';

// Shared building blocks for the project's table-card surfaces (Plan / Rooms),
// matching the clean loan-dashboard reference: white card, uppercase column
// headers, mono ID columns, hairline rows, status + filter pills.

export function TableCard({
  title,
  count,
  amount,
  action,
  children,
  className = '',
}: {
  title: string;
  count?: number;
  /** Right-aligned total/cost shown in the header (e.g. a per-card rollup). */
  amount?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4 sm:p-5 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold text-[var(--hm-fg-primary)]">
          <span className="truncate">{title}</span>
          {count != null && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--hm-bg-tertiary)] px-1.5 text-[12px] font-semibold tabular-nums text-[var(--hm-fg-secondary)]">
              {count}
            </span>
          )}
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          {amount != null && (
            <span className="text-[15px] font-bold tabular-nums text-[var(--hm-fg-primary)]">
              {amount}
            </span>
          )}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export function FilterPills({
  options,
  active,
  onChange,
  className = '',
}: {
  options: FilterOption[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((o) => {
        const on = o.id === active;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              on
                ? 'bg-[var(--hm-brand-500)] text-white'
                : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]'
            }`}
          >
            {o.label}
            {o.count != null && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums ${
                  on
                    ? 'bg-white/25 text-white'
                    : 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-muted)]'
                }`}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// A small status pill in the loan-dashboard style: soft tint + label.
export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'brand';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]',
    info: 'bg-[var(--hm-info-50)] text-[var(--hm-info-600)]',
    success: 'bg-[var(--hm-success-50)] text-[var(--hm-success-600)]',
    warning: 'bg-[var(--hm-warning-50)] text-[var(--hm-warning-600)]',
    brand: 'bg-[var(--hm-brand-50)] text-[var(--hm-brand-600)]',
  };
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Column-header row. Pass the same grid-template class to head + rows so
// columns line up. Cells are uppercase, tracked, muted.
export const HEAD_CLASS =
  'grid items-center gap-3 border-b border-[var(--hm-border-subtle)] pb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--hm-fg-muted)]';

// A data row: hairline separator, last row borderless.
export const ROW_CLASS =
  'grid items-center gap-3 border-b border-[var(--hm-border-subtle)] py-3 text-[14px] text-[var(--hm-fg-primary)] last:border-0';

// Mono cell for IDs / loan-number-style columns.
export const MONO_CLASS =
  'font-mono text-[12px] text-[var(--hm-fg-muted)] tabular-nums';
