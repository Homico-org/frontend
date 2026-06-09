'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'relative inline-flex items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      // Tighter proportions than before — the previous toggles felt stretched
      // because the track was much wider than the thumb cleared. New track
      // width = (thumb diameter + horizontal padding × 2) × 2.
      size: {
        sm: 'w-7 h-[18px]',
        md: 'w-9 h-[22px]',
        lg: 'w-12 h-[28px]',
      },
      variant: {
        default: 'focus-visible:ring-[var(--hm-brand-500)]',
        primary: 'focus-visible:ring-[var(--hm-brand-500)]',
        success: 'focus-visible:ring-green-500',
        violet: 'focus-visible:ring-violet-500',
        danger: 'focus-visible:ring-red-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const thumbSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-[18px] h-[18px]',
  lg: 'w-6 h-6',
};

// Thumb start/end positions tuned to the new tighter tracks above.
const thumbPositions = {
  sm: { off: 'translate-x-[2px]', on: 'translate-x-[12px]' },
  md: { off: 'translate-x-[2px]', on: 'translate-x-[16px]' },
  lg: { off: 'translate-x-[2px]', on: 'translate-x-[22px]' },
};

// Off-state: outlined track with no fill — reads as "not active" via the
// thumb's resting position, like Vercel/Linear. Eliminates the gray pill feel.
// On-state: filled brand color.
const ON_COLORS = {
  default: 'bg-[var(--hm-brand-500)]',
  primary: 'bg-[var(--hm-brand-500)]',
  success: 'bg-[var(--hm-success-500)]',
  violet: 'bg-[var(--hm-brand-500)]',
  danger: 'bg-[var(--hm-error-500)]',
};

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof toggleVariants> {
  label?: ReactNode;
  description?: string;
  labelPosition?: 'left' | 'right';
}

/**
 * Toggle/Switch component
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      className,
      size = 'md',
      variant = 'default',
      checked = false,
      disabled,
      label,
      description,
      labelPosition = 'right',
      onChange,
      ...props
    },
    ref
  ) => {
    const onColor = ON_COLORS[variant || 'default'];
    const thumbSize = thumbSizes[size || 'md'];
    const positions = thumbPositions[size || 'md'];

    // Stable id so the visible description is associated to the input via
    // aria-describedby — screen readers announce the description on focus.
    const reactId = useId();
    const descriptionId = description ? `${reactId}-desc` : undefined;

    const toggleElement = (
      <label className={cn('relative inline-flex cursor-pointer', disabled && 'cursor-not-allowed')}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          aria-checked={!!checked}
          aria-describedby={descriptionId}
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          {...props}
        />
        <div
          aria-hidden="true"
          className={cn(
            toggleVariants({ size, variant }),
            checked && onColor,
            className
          )}
          style={
            checked
              ? undefined
              : {
                  // Visible cool-gray fill so it reads as a switch surface,
                  // not an "outlined nothing". White thumb on a gray track
                  // is the universally recognized switch pattern.
                  backgroundColor: 'var(--hm-n-200)',
                }
          }
        >
          <span
            className={cn(
              'inline-block rounded-full bg-white transition-transform duration-200',
              thumbSize,
              checked ? positions.on : positions.off
            )}
            style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.04)',
            }}
          />
        </div>
      </label>
    );

    if (!label) {
      return toggleElement;
    }

    return (
      <div className={cn('flex items-center gap-3', labelPosition === 'left' && 'flex-row-reverse')}>
        {toggleElement}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              'text-sm font-medium',
              disabled ? 'text-[var(--hm-fg-muted)]' : 'text-[var(--hm-fg-primary)]'
            )}
          >
            {label}
          </span>
          {description && (
            <p id={descriptionId} className="text-xs text-[var(--hm-fg-muted)] mt-0.5">{description}</p>
          )}
        </div>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
