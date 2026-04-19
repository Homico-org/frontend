'use client';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { forwardRef, InputHTMLAttributes, useState } from 'react';

const inputVariants = cva(
  'w-full rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-sm pl-10 pr-10',
        md: 'px-4 py-3 text-base pl-12 pr-12',
        lg: 'px-5 py-4 text-lg pl-14 pr-14',
      },
      variant: {
        default: 'border focus:ring-[var(--hm-brand-500)]/50 focus:border-[var(--hm-brand-500)]',
        error: 'border border-[var(--hm-error-500)]/20 focus:ring-[var(--hm-error-500)]/50 focus:border-[var(--hm-error-500)]',
        success: 'border border-[var(--hm-success-500)]/20 focus:ring-[var(--hm-success-500)]/50 focus:border-[var(--hm-success-500)]',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const iconPositions = {
  sm: 'left-3',
  md: 'left-4',
  lg: 'left-5',
};

const togglePositions = {
  sm: 'right-3',
  md: 'right-4',
  lg: 'right-5',
};

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof inputVariants> {
  showIcon?: boolean;
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Password input with visibility toggle
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      showIcon = true,
      label,
      error,
      hint,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const actualVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--hm-fg-primary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {showIcon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 pointer-events-none',
                iconPositions[size || 'md']
              )}
            >
              <Lock
                className={cn(
                  iconSizes[size || 'md'],
                  error ? 'text-[var(--hm-error-500)]' : 'text-neutral-400'
                )}
              />
            </div>
          )}
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            disabled={disabled}
            className={cn(
              inputVariants({ size, variant: actualVariant }),
              !showIcon && 'pl-4',
              className
            )}
            style={{
              backgroundColor: 'var(--hm-bg-elevated)',
              borderColor: error ? undefined : 'var(--hm-border)',
              color: 'var(--hm-fg-primary)',
            }}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--hm-bg-tertiary)] transition-colors disabled:opacity-50',
              togglePositions[size || 'md']
            )}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff
                className={cn(
                  iconSizes[size || 'md'],
                  'text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]'
                )}
              />
            ) : (
              <Eye
                className={cn(
                  iconSizes[size || 'md'],
                  'text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]'
                )}
              />
            )}
          </button>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[var(--hm-error-500)]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-[var(--hm-fg-muted)]">{hint}</p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
