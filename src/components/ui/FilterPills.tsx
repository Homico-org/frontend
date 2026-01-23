'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ACCENT_COLOR } from '@/constants/theme';

const filterPillsContainerVariants = cva(
  'flex gap-2',
  {
    variants: {
      scrollable: {
        true: 'overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4',
        false: 'flex-wrap',
      },
    },
    defaultVariants: {
      scrollable: true,
    },
  }
);

const filterPillVariants = cva(
  'inline-flex items-center gap-2 font-medium whitespace-nowrap transition-all duration-200 border',
  {
    variants: {
      size: {
        sm: 'px-3 py-1.5 text-xs rounded-lg',
        default: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-5 py-2.5 text-sm rounded-xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface FilterPillOption {
  /** Unique identifier */
  key: string;
  /** Display label */
  label: string;
  /** Optional count to show */
  count?: number;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Whether this option is disabled */
  disabled?: boolean;
}

export interface FilterPillsProps
  extends VariantProps<typeof filterPillsContainerVariants>,
    VariantProps<typeof filterPillVariants> {
  /** Array of options */
  options: FilterPillOption[];
  /** Currently selected key */
  value: string;
  /** Selection change callback */
  onChange: (key: string) => void;
  /** Show "All" option at the start */
  showAll?: boolean;
  /** Label for "All" option */
  allLabel?: string;
  /** Count for "All" option */
  allCount?: number;
  /** Active color variant */
  activeVariant?: 'terracotta' | 'forest' | 'neutral';
  /** Additional container class names */
  className?: string;
  /** Additional pill class names */
  pillClassName?: string;
}

const activeColors = {
  terracotta: {
    bg: 'bg-[#E07B4F]',
    text: 'text-white',
    border: 'border-[#E07B4F]',
  },
  forest: {
    bg: 'bg-[#4A7C59]',
    text: 'text-white',
    border: 'border-[#4A7C59]',
  },
  neutral: {
    bg: 'bg-neutral-900 dark:bg-white',
    text: 'text-white dark:text-neutral-900',
    border: 'border-neutral-900 dark:border-white',
  },
};

const inactiveStyles =
  'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 hover:border-neutral-300 dark:hover:border-neutral-600';

/**
 * Horizontal scrollable filter pills for category/filter selection.
 *
 * @example
 * ```tsx
 * const categories = [
 *   { key: 'electrical', label: 'Electrical', count: 12, icon: Zap },
 *   { key: 'plumbing', label: 'Plumbing', count: 8, icon: Droplets },
 * ];
 *
 * <FilterPills
 *   options={categories}
 *   value={selected}
 *   onChange={setSelected}
 *   showAll
 *   allLabel="All Categories"
 *   allCount={100}
 * />
 * ```
 */
export function FilterPills({
  options,
  value,
  onChange,
  showAll = false,
  allLabel = 'All',
  allCount,
  activeVariant = 'terracotta',
  scrollable = true,
  size = 'default',
  className,
  pillClassName,
}: FilterPillsProps) {
  const activeStyle = activeColors[activeVariant];

  const renderPill = (
    key: string,
    label: string,
    count?: number,
    Icon?: LucideIcon,
    disabled?: boolean
  ) => {
    const isActive = value === key;

    return (
      <button
        key={key}
        type="button"
        onClick={() => !disabled && onChange(key)}
        disabled={disabled}
        className={cn(
          filterPillVariants({ size }),
          isActive
            ? cn(activeStyle.bg, activeStyle.text, activeStyle.border)
            : inactiveStyles,
          disabled && 'opacity-50 cursor-not-allowed',
          pillClassName
        )}
      >
        {Icon && <Icon className="w-4 h-4" strokeWidth={1.5} />}
        <span>{label}</span>
        {count !== undefined && (
          <span
            className={cn(
              'text-xs',
              isActive ? 'text-white/70' : 'text-neutral-400'
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={cn(filterPillsContainerVariants({ scrollable }), className)}>
      {showAll && renderPill('all', allLabel, allCount)}
      {options.map((option) =>
        renderPill(option.key, option.label, option.count, option.icon, option.disabled)
      )}
    </div>
  );
}

export default FilterPills;
