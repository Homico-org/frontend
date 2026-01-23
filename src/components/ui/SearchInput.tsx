'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

const searchInputVariants = cva(
  'flex w-full rounded-xl text-[var(--color-text-primary)] transition-all duration-300 placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/15',
        filled:
          'bg-[var(--color-bg-tertiary)] border border-transparent focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/15',
        forest:
          'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] focus:outline-none focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/15',
      },
      inputSize: {
        sm: 'h-9 px-3 py-2 text-xs',
        default: 'h-11 px-4 py-2.5 text-sm',
        lg: 'h-12 px-5 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof searchInputVariants> {
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Show clear button when has value */
  clearable?: boolean;
  /** Custom icon (defaults to Search) */
  icon?: React.ReactNode;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      variant,
      inputSize,
      value,
      onChange,
      onValueChange,
      clearable = true,
      icon,
      ...props
    },
    ref
  ) => {
    const hasValue = value !== undefined && value !== '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    const handleClear = () => {
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
      onValueChange?.('');
    };

    return (
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
          {icon || <Search className="w-5 h-5" strokeWidth={1.5} />}
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className={cn(
            searchInputVariants({ variant, inputSize }),
            'pl-11',
            clearable && hasValue && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {clearable && hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { SearchInput, searchInputVariants };
