'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'w-8 h-5',
        md: 'w-11 h-6',
        lg: 'w-14 h-8',
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
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

const thumbPositions = {
  sm: { off: 'translate-x-1', on: 'translate-x-4' },
  md: { off: 'translate-x-1', on: 'translate-x-6' },
  lg: { off: 'translate-x-1', on: 'translate-x-7' },
};

const bgColors = {
  default: { on: 'bg-[var(--hm-brand-500)]', off: 'bg-[var(--hm-bg-tertiary)]' },
  primary: { on: 'bg-[var(--hm-brand-500)]', off: 'bg-[var(--hm-bg-tertiary)]' },
  success: { on: 'bg-[var(--hm-success-500)]', off: 'bg-[var(--hm-bg-tertiary)]' },
  violet: { on: 'bg-[var(--hm-brand-500)]', off: 'bg-[var(--hm-bg-tertiary)]' },
  danger: { on: 'bg-[var(--hm-error-500)]', off: 'bg-[var(--hm-bg-tertiary)]' },
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
    const colors = bgColors[variant || 'default'];
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
            checked ? colors.on : colors.off,
            className
          )}
        >
          <span
            className={cn(
              'inline-block rounded-full bg-[var(--hm-bg-elevated)] shadow-sm transition-transform duration-200',
              thumbSize,
              checked ? positions.on : positions.off
            )}
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
              disabled ? 'text-neutral-400' : 'text-[var(--hm-fg-primary)]'
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
