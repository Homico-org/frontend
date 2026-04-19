'use client';

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Homico Design System — Badge
 * Architectural cut-corner chips. border-radius: 0.
 * clip-path for cut corners. Uppercase, 11px, font-weight 600.
 * Semantic variants use border color + leading dot, not bg tint.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.02em] border text-[var(--hm-fg-primary)] border-[var(--hm-n-900)]",
  {
    variants: {
      variant: {
        default:
          "bg-transparent",
        secondary:
          "border-[var(--hm-border-strong)] text-[var(--hm-fg-secondary)]",
        success:
          "border-[var(--hm-success-500)] text-[var(--hm-success-500)]",
        warning:
          "border-[#8A6312] text-[#8A6312]",
        danger:
          "border-[var(--hm-error-500)] text-[var(--hm-error-500)]",
        info:
          "border-[var(--hm-info-500)] text-[var(--hm-info-500)]",
        outline:
          "border-[var(--hm-border-strong)] text-[var(--hm-fg-secondary)] border-dashed",
        premium:
          "bg-[var(--hm-brand-500)] text-white border-[var(--hm-brand-500)]",
        ghost:
          "border-[var(--hm-border-strong)] border-dashed text-[var(--hm-fg-muted)]",
        pulse:
          "bg-[var(--hm-brand-500)] text-white border-[var(--hm-brand-500)] animate-pulse",
        "danger-solid":
          "bg-[var(--hm-error-500)] text-white border-[var(--hm-error-500)]",
        "success-solid":
          "bg-[var(--hm-success-500)] text-white border-[var(--hm-success-500)]",
        "warning-solid":
          "bg-[var(--hm-warning-500)] text-white border-[var(--hm-warning-500)]",
        "info-solid":
          "bg-[var(--hm-info-500)] text-white border-[var(--hm-info-500)]",
        "accent-solid":
          "bg-[var(--hm-brand-500)] text-white border-[var(--hm-brand-500)]",
      },
      size: {
        count: "text-[10px] min-w-[18px] h-[18px] px-1 rounded-full !gap-0 !inline-grid place-items-center normal-case tracking-normal",
        xs: "text-[9px] px-1.5 py-0.5",
        sm: "text-[10px] px-2 py-0.5",
        default: "text-[11px] px-2.5 py-1",
        lg: "text-sm px-3.5 py-1.5",
        xl: "text-base px-4 py-2",
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
      default: 'bg-[var(--hm-brand-500)]',
      success: 'bg-[var(--hm-success-500)]',
      warning: 'bg-[var(--hm-warning-500)]',
      danger: 'bg-[var(--hm-error-500)]',
    };

    // Cut-corner clip-path (skip for count/round badges)
    const clipStyle = size === 'count'
      ? undefined
      : { clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' } as React.CSSProperties;

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        style={clipStyle}
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
            className="flex-shrink-0 ml-0.5 -mr-1 h-4 w-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
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
  ({ count, max = 99, showZero = false, size = 'count', variant = 'danger-solid', className, ...props }, ref) => {
    if (count === 0 && !showZero) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        variant={variant}
        size={size}
        className={cn("font-bold", className)}
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
)
CountBadge.displayName = "CountBadge"

export { Badge, StatusBadge, CountBadge, badgeVariants }
