'use client';

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'flex items-start gap-3 p-4 rounded-xl border transition-all',
  {
    variants: {
      variant: {
        default: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        accent: 'bg-[#C4735B]/10 border-[#C4735B]/30',
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
  default: 'text-neutral-500',
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  accent: 'text-[#C4735B]',
};

const textColors = {
  default: 'text-neutral-800 dark:text-neutral-200',
  success: 'text-green-800 dark:text-green-200',
  error: 'text-red-800 dark:text-red-200',
  warning: 'text-yellow-800 dark:text-yellow-200',
  info: 'text-blue-800 dark:text-blue-200',
  accent: 'text-[#C4735B] dark:text-[#C4735B]',
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
            'flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
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
