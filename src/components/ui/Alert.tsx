'use client';

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Homico Design System — Alert / Nudge
 * No border-radius. Left border accent (3px). Semantic backgrounds.
 */
const alertVariants = cva(
  'flex items-center gap-3 border-l-[3px] transition-all',
  {
    variants: {
      variant: {
        default: 'bg-[var(--hm-bg-tertiary)] border-l-[var(--hm-n-400)]',
        success: 'bg-[var(--hm-success-50)] border-l-[var(--hm-success-500)]',
        error: 'bg-[var(--hm-error-50)] border-l-[var(--hm-error-500)]',
        warning: 'bg-[var(--hm-warning-50)] border-l-[var(--hm-warning-500)]',
        info: 'bg-[var(--hm-info-50)] border-l-[var(--hm-info-500)]',
        accent: 'bg-[var(--hm-brand-50)] border-l-[var(--hm-brand-500)]',
      },
      size: {
        sm: 'p-3 text-xs',
        md: 'p-4 text-sm',
        lg: 'p-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const iconColors = {
  default: 'text-[var(--hm-n-500)]',
  success: 'text-[var(--hm-success-500)]',
  error: 'text-[var(--hm-error-500)]',
  warning: 'text-[var(--hm-warning-500)]',
  info: 'text-[var(--hm-info-500)]',
  accent: 'text-[var(--hm-brand-500)]',
};

const textColors = {
  default: 'text-[var(--hm-fg-primary)]',
  success: 'text-green-800',
  error: 'text-[var(--hm-error-500)]',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
  accent: 'text-[var(--hm-brand-500)]',
};

const defaultIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  accent: Info,
};

export interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Alert component for displaying messages
 */
export function Alert({
  children,
  title,
  icon,
  showIcon = true,
  dismissible = false,
  onDismiss,
  variant = 'default',
  size = 'md',
  className,
}: AlertProps) {
  const IconComponent = defaultIcons[variant || 'default'];
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className={cn(alertVariants({ variant, size }), className)}>
      {showIcon && (
        <div className={cn('flex-shrink-0', iconColors[variant || 'default'])}>
          {icon || <IconComponent className={iconSize} />}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h4
            className={cn(
              'font-semibold mb-1',
              textColors[variant || 'default']
            )}
          >
            {title}
          </h4>
        )}
        <div className={cn(textColors[variant || 'default'])}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors',
            iconColors[variant || 'default']
          )}
        >
          <X className={iconSize} />
        </button>
      )}
    </div>
  );
}

export default Alert;
