'use client';

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-bg-tertiary)]",
        terracotta: "bg-[#D2691E]/10",
        gradient: "bg-gradient-to-r from-[#D2691E]/5 to-[#CD853F]/10",
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
        default: "bg-[#D2691E]",
        gradient: "bg-gradient-to-r from-[#D2691E] to-[#CD853F]",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        danger: "bg-red-500",
        animated: "bg-gradient-to-r from-[#D2691E] via-[#CD853F] to-[#D2691E] bg-[length:200%_100%] animate-gradient-shimmer",
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
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </span>
        )}
        {(showValue || showPercentage) && (
          <span className="text-sm font-bold text-[#D2691E]">
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
        className={cn(indicatorVariants({ indicatorVariant }), "rounded-full")}
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
            stroke="var(--color-border)"
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
              <stop offset="0%" stopColor="#D2691E" />
              <stop offset="100%" stopColor="#CD853F" />
            </linearGradient>
          </defs>
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "font-bold text-[var(--color-text-primary)]",
              size === 'sm' && "text-[10px]",
              size === 'default' && "text-xs",
              size === 'lg' && "text-sm",
              size === 'xl' && "text-base"
            )}>
              {Math.round(value)}%
            </span>
            {label && size !== 'sm' && (
              <span className="text-[9px] text-[var(--color-text-tertiary)]">{label}</span>
            )}
          </div>
        )}
      </div>
    );
  }
)
CircleProgress.displayName = "CircleProgress"

// ============================================================================
// Step Progress - for multi-step forms
// ============================================================================

interface Step {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  ({ steps, currentStep, className }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300",
                      isCompleted && "bg-gradient-to-br from-[#D2691E] to-[#B8560E] text-white shadow-lg shadow-[#D2691E]/25",
                      isCurrent && "bg-[#D2691E]/10 text-[#D2691E] border-2 border-[#D2691E]",
                      !isCompleted && !isCurrent && "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                    )}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.icon ? (
                      step.icon
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-xs font-medium",
                      (isCompleted || isCurrent) ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                    )}>
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 max-w-[80px]">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2 mt-[-2rem]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-gradient-to-r from-[#D2691E] to-[#CD853F]" : "bg-[var(--color-border)]"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
)
StepProgress.displayName = "StepProgress"

export { Progress, CircleProgress, StepProgress, progressVariants, indicatorVariants }
