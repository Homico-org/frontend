'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { ACCENT_COLOR } from '@/constants/theme';

export type SelectionGroupLayout = 'horizontal' | 'vertical' | 'grid';
export type SelectionGroupSize = 'sm' | 'md' | 'lg';

export interface SelectionOption<T = string> {
  value: T;
  label: string;
  labelKa?: string;
  description?: string;
  descriptionKa?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SelectionGroupProps<T = string> {
  /** Array of options to display */
  options: SelectionOption<T>[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Layout direction */
  layout?: SelectionGroupLayout;
  /** Size variant */
  size?: SelectionGroupSize;
  /** Number of columns for grid layout */
  columns?: 2 | 3 | 4;
  /** Language locale */
  locale?: 'en' | 'ka' | 'ru';
  /** Whether selection is required (shows visual indicator) */
  required?: boolean;
  /** Additional class names */
  className?: string;
  /** Label for the group */
  label?: string;
  /** Use pill style (rounded-full) */
  pill?: boolean;
}

// Size configurations
const sizeConfig: Record<SelectionGroupSize, {
  button: string;
  text: string;
  icon: string;
  gap: string;
}> = {
  sm: { button: 'py-2 px-3', text: 'text-xs', icon: 'w-4 h-4', gap: 'gap-1.5' },
  md: { button: 'py-2.5 px-4', text: 'text-sm', icon: 'w-5 h-5', gap: 'gap-2' },
  lg: { button: 'py-3 px-5', text: 'text-base', icon: 'w-6 h-6', gap: 'gap-2' },
};

/**
 * Reusable selection group component for mutually exclusive options.
 * Commonly used for budget types, timing options, condition selectors, etc.
 *
 * @example
 * ```tsx
 * const budgetTypes = [
 *   { value: 'fixed', label: 'Fixed Price', labelKa: 'ფიქსირებული' },
 *   { value: 'range', label: 'Range', labelKa: 'დიაპაზონი' },
 *   { value: 'negotiable', label: 'Negotiable', labelKa: 'შეთანხმებით' },
 * ];
 *
 * <SelectionGroup
 *   options={budgetTypes}
 *   value={selectedType}
 *   onChange={setSelectedType}
 *   locale="en"
 * />
 * ```
 */
export function SelectionGroup<T extends string | number = string>({
  options,
  value,
  onChange,
  layout = 'horizontal',
  size = 'md',
  columns = 3,
  locale = 'en',
  required,
  className,
  label,
  pill = false,
}: SelectionGroupProps<T>) {
  const sizeStyles = sizeConfig[size];

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col gap-2';
      case 'grid':
        const gridCols = {
          2: 'grid-cols-2',
          3: 'grid-cols-3',
          4: 'grid-cols-4',
        };
        return `grid ${gridCols[columns]} gap-2`;
      case 'horizontal':
      default:
        return 'flex gap-2';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={getLayoutClasses()}>
        {options.map((option) => {
          const isSelected = option.value === value;
          const displayLabel = locale === 'ka' && option.labelKa ? option.labelKa : option.label;
          const displayDescription = locale === 'ka' && option.descriptionKa
            ? option.descriptionKa
            : option.description;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              className={cn(
                'flex-1 font-medium border-2 transition-all',
                sizeStyles.button,
                sizeStyles.text,
                pill ? 'rounded-full' : 'rounded-xl',
                option.icon && 'flex items-center justify-center',
                option.icon && sizeStyles.gap,
                option.disabled && 'opacity-50 cursor-not-allowed',
                !isSelected && 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
              )}
              style={isSelected ? {
                borderColor: ACCENT_COLOR,
                backgroundColor: `${ACCENT_COLOR}0D`,
                color: ACCENT_COLOR,
              } : undefined}
            >
              {option.icon && (
                <span className={sizeStyles.icon}>{option.icon}</span>
              )}
              <span>{displayLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SelectionCardGroupProps<T = string> extends Omit<SelectionGroupProps<T>, 'pill'> {
  /** Show descriptions below labels */
  showDescriptions?: boolean;
}

/**
 * Selection group with card-style options (larger, with optional descriptions)
 *
 * @example
 * ```tsx
 * const options = [
 *   {
 *     value: 'asap',
 *     label: 'As soon as possible',
 *     description: 'Start immediately',
 *     icon: <Zap className="w-5 h-5" />,
 *   },
 *   {
 *     value: 'flexible',
 *     label: 'Flexible',
 *     description: 'No rush',
 *     icon: <Calendar className="w-5 h-5" />,
 *   },
 * ];
 *
 * <SelectionCardGroup options={options} value={selected} onChange={setSelected} />
 * ```
 */
export function SelectionCardGroup<T extends string | number = string>({
  options,
  value,
  onChange,
  layout = 'horizontal',
  columns = 2,
  locale = 'en',
  className,
  label,
  required,
  showDescriptions = true,
}: SelectionCardGroupProps<T>) {
  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'flex flex-col gap-3';
      case 'grid':
        const gridCols = {
          2: 'grid-cols-1 sm:grid-cols-2',
          3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          4: 'grid-cols-2 lg:grid-cols-4',
        };
        return `grid ${gridCols[columns]} gap-3`;
      case 'horizontal':
      default:
        return 'flex gap-3';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={getLayoutClasses()}>
        {options.map((option) => {
          const isSelected = option.value === value;
          const displayLabel = locale === 'ka' && option.labelKa ? option.labelKa : option.label;
          const displayDescription = locale === 'ka' && option.descriptionKa
            ? option.descriptionKa
            : option.description;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              className={cn(
                'flex-1 p-4 rounded-xl border-2 transition-all text-left',
                option.disabled && 'opacity-50 cursor-not-allowed',
                !isSelected && 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'
              )}
              style={isSelected ? {
                borderColor: ACCENT_COLOR,
                backgroundColor: `${ACCENT_COLOR}0D`,
              } : undefined}
            >
              <div className="flex items-start gap-3">
                {option.icon && (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isSelected ? `${ACCENT_COLOR}1A` : undefined,
                      color: isSelected ? ACCENT_COLOR : undefined,
                    }}
                  >
                    {option.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium"
                    style={{ color: isSelected ? ACCENT_COLOR : undefined }}
                  >
                    {displayLabel}
                  </div>
                  {showDescriptions && displayDescription && (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {displayDescription}
                    </div>
                  )}
                </div>
                {/* Selection indicator */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'border-current' : 'border-neutral-300 dark:border-neutral-600'
                  )}
                  style={isSelected ? { borderColor: ACCENT_COLOR } : undefined}
                >
                  {isSelected && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ACCENT_COLOR }}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SelectionGroup;
