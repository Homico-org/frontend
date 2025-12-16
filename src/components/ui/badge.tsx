'use client';

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-[#E07B4F]/10 text-[#E07B4F] border border-[#E07B4F]/20",
        secondary:
          "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
        success:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        warning:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        danger:
          "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
        info:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        outline:
          "bg-transparent text-[#E07B4F] border border-[#E07B4F]/30",
        premium:
          "bg-gradient-to-r from-[#E07B4F]/15 to-[#E8956A]/20 text-[#E07B4F] border border-[#E07B4F]/25 shadow-sm",
        ghost:
          "bg-transparent text-[var(--color-text-secondary)]",
        pulse:
          "bg-[#E07B4F]/10 text-[#E07B4F] border border-[#E07B4F]/20 animate-pulse",
      },
      size: {
        xs: "text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider",
        sm: "text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider",
        default: "text-xs px-2.5 py-1 rounded-xl",
        lg: "text-sm px-3 py-1.5 rounded-xl",
        xl: "text-base px-4 py-2 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  dotColor?: 'default' | 'success' | 'warning' | 'danger';
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, dot, dotColor = 'default', removable, onRemove, children, ...props }, ref) => {
    const dotColors = {
      default: 'bg-[#E07B4F]',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    };

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[dotColor]
            )} />
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColors[dotColor]
            )} />
          </span>
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 ml-0.5 -mr-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

// ============================================================================
// Status Badge - specialized for status indicators
// ============================================================================

type StatusType = 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning' | 'expired';

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: StatusType;
}

const statusConfig: Record<StatusType, { variant: BadgeProps['variant']; dot: boolean; dotColor: BadgeProps['dotColor'] }> = {
  active: { variant: 'success', dot: true, dotColor: 'success' },
  inactive: { variant: 'secondary', dot: false, dotColor: 'default' },
  pending: { variant: 'warning', dot: true, dotColor: 'warning' },
  success: { variant: 'success', dot: false, dotColor: 'success' },
  error: { variant: 'danger', dot: false, dotColor: 'danger' },
  warning: { variant: 'warning', dot: false, dotColor: 'warning' },
  expired: { variant: 'danger', dot: false, dotColor: 'danger' },
};

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const config = statusConfig[status];
    return (
      <Badge
        ref={ref}
        variant={config.variant}
        dot={config.dot}
        dotColor={config.dotColor}
        {...props}
      >
        {children}
      </Badge>
    );
  }
)
StatusBadge.displayName = "StatusBadge"

// ============================================================================
// Count Badge - for notification counts
// ============================================================================

interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

const CountBadge = React.forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, size = 'xs', variant = 'default', ...props }, ref) => {
    if (count === 0 && !showZero) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        variant={variant}
        size={size}
        className="min-w-[1.25rem] justify-center"
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
)
CountBadge.displayName = "CountBadge"

export { Badge, StatusBadge, CountBadge, badgeVariants }
