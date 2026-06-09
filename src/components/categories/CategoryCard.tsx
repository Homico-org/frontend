'use client';

import CategoryIcon from '@/components/categories/CategoryIcon';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';

interface CategoryCardProps {
  name: string;
  /** Icon key for CategoryIcon (cat.icon || cat.key). */
  iconType: string;
  /** The category's catalog color (hex). Drives the accent rule, icon + selected state. */
  color?: string;
  /** Secondary line, e.g. "8 ვარიანტი" or "3 არჩეული". Rendered mono. */
  meta?: string;
  /** Picker selection state - accent border + spring-in check + whisper tint. */
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Category card. The category's catalog `color` reads as a crisp, always-on
 * accent: a solid 3px left rule (turns a gray grid into a color-coded, scannable
 * picker) + the icon. NO gradients, NO blur, NO drop shadow - identity lives in
 * the left rule, selection lives in the border + check. Depth comes from the
 * elevated-on-paper contrast and a small hover lift.
 *
 * Reusable across registration / profile-setup pickers, the post-job category
 * step, and browse category strips.
 */
export default function CategoryCard({
  name,
  iconType,
  color,
  meta,
  selected = false,
  onClick,
  className,
}: CategoryCardProps) {
  const accent = color || 'var(--hm-brand-500)';
  const isHex = accent.startsWith('#');
  // A whisper-thin tint for the selected ground (hex + ~4% alpha).
  const selectedTint = isHex ? `${accent}0A` : 'var(--hm-brand-50)';

  const style: CSSProperties = {
    // Expose the accent to Tailwind arbitrary utilities (hover border tint).
    ['--cat' as string]: accent,
    backgroundColor: selected ? selectedTint : 'var(--hm-bg-elevated)',
    // 1.5px inset accent reads as the selected border with zero layout reflow.
    boxShadow: selected ? `inset 0 0 0 1.5px ${accent}` : undefined,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={style}
      className={cn(
        'group relative flex h-full min-h-[112px] flex-col justify-between overflow-hidden rounded-[14px] border border-[var(--hm-border-subtle)] py-4 pl-[19px] pr-4 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:[border-color:color-mix(in_srgb,var(--cat)_45%,transparent)] active:scale-[0.99]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/30',
        className,
      )}
    >
      {/* Always-on solid 3px left accent rule - the category's identity. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-[14px]"
        style={{ backgroundColor: accent }}
      />

      {/* Top row: bare accent icon + reserved check slot (no layout shift) */}
      <div className="flex w-full items-center justify-between">
        <span
          className="transition-transform duration-200 group-hover:scale-105"
          style={{ color: accent }}
        >
          <CategoryIcon type={iconType} className="h-6 w-6" />
        </span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
              selected ? 'scale-100' : 'scale-0',
            )}
            style={{ backgroundColor: accent }}
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
        </span>
      </div>

      {/* Name + mono count */}
      <div className="min-w-0">
        <span className="block text-[14px] font-bold leading-[1.25] tracking-[-0.01em] text-[var(--hm-fg-primary)]">
          {name}
        </span>
        {meta && (
          <span
            className="mt-1 block font-mono text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ color: selected ? accent : 'var(--hm-fg-muted)' }}
          >
            {meta}
          </span>
        )}
      </div>
    </button>
  );
}
