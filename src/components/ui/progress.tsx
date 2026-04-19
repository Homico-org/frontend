'use client';

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-[var(--hm-bg-tertiary)]",
        terracotta: "bg-[var(--hm-brand-50)]",
        gradient: "bg-[var(--hm-bg-tertiary)]",
      },
      size: {
        sm: "h-1.5",
        default: "h-2.5",
        lg: "h-4",
        xl: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full transition-all duration-500 ease-out",
  {
    variants: {
      indicatorVariant: {
        default: "bg-[var(--hm-brand-500)]",
        gradient: "bg-gradient-to-r from-[var(--hm-brand-500)] to-[var(--hm-brand-300)]",
        success: "bg-[var(--hm-success-500)]",
        warning: "bg-[var(--hm-warning-500)]",
        danger: "bg-[var(--hm-error-500)]",
        animated: "bg-gradient-to-r from-[var(--hm-brand-500)] via-[var(--hm-brand-300)] to-[var(--hm-brand-500)] bg-[length:200%_100%] animate-gradient-shimmer",
      },
    },
    defaultVariants: {
      indicatorVariant: "gradient",
    },
  }
)

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof indicatorVariants> {
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, indicatorVariant, showValue, showPercentage, label, ...props }, ref) => (
  <div className="space-y-2">
    {(label || showValue || showPercentage) && (
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-sm font-medium text-[var(--hm-fg-secondary)]">
            {label}
          </span>
        )}
        {(showValue || showPercentage) && (
          <span className="text-sm font-bold text-[var(--hm-brand-500)]">
            {showPercentage ? `${Math.round(value || 0)}%` : value}
          </span>
        )}
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(indicatorVariants({ indicatorVariant }))}
        style={{ width: `${value || 0}%` }}
      />
    </ProgressPrimitive.Root>
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// ============================================================================
// Circle Progress - circular progress indicator
// ============================================================================

interface CircleProgressProps {
  value: number;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
  className?: string;
}

const circleSizes = {
  sm: 32,
  default: 48,
  lg: 64,
  xl: 80,
};

const CircleProgress = React.forwardRef<HTMLDivElement, CircleProgressProps>(
  ({ value, size = 'default', strokeWidth = 4, showValue = true, label, className }, ref) => {
    const sizeValue = circleSizes[size];
    const radius = (sizeValue - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div ref={ref} className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          className="transform -rotate-90"
          width={sizeValue}
          height={sizeValue}
        >
          {/* Background circle */}
          <circle
            cx={sizeValue / 2}
            cy={sizeValue / 2}
            r={radius}
            fill="none"
            stroke="var(--hm-border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={sizeValue / 2}
            cy={sizeValue / 2}
            r={radius}
            fill="none"
            stroke="url(#progress-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--hm-brand-500)" />
              <stop offset="100%" stopColor="#F28764" />
            </linearGradient>
          </defs>
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "font-bold text-[var(--hm-fg-primary)]",
              size === 'sm' && "text-[10px]",
              size === 'default' && "text-xs",
              size === 'lg' && "text-sm",
              size === 'xl' && "text-base"
            )}>
              {Math.round(value)}%
            </span>
            {label && size !== 'sm' && (
              <span className="text-[9px] text-[var(--hm-fg-muted)]">{label}</span>
            )}
          </div>
        )}
      </div>
    );
  }
)
CircleProgress.displayName = "CircleProgress"

export { Progress, CircleProgress, progressVariants, indicatorVariants }
