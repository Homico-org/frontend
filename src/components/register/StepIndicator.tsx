'use client';

import { Check } from 'lucide-react';

export interface Step {
  id: string;
  title: string;
  subtitle?: string;
}

export interface StepIndicatorProps {
  /** Array of step definitions */
  steps: Step[];
  /** Current active step ID */
  currentStep: string;
  /** Completed step IDs */
  completedSteps?: string[];
  /** Handler for step click (optional, makes steps clickable) */
  onStepClick?: (stepId: string) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show titles (for horizontal mode) */
  showTitles?: boolean;
  /** Custom className */
  className?: string;
}

export default function StepIndicator({
  steps,
  currentStep,
  completedSteps = [],
  onStepClick,
  orientation = 'horizontal',
  size = 'md',
  showTitles = true,
  className = '',
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  const sizeClasses = {
    sm: {
      circle: 'w-6 h-6 text-xs',
      lineWidth: 'w-8 sm:w-12',
      lineHeight: 'h-0.5',
      title: 'text-xs',
      subtitle: 'text-[10px]',
      gap: 'gap-1',
    },
    md: {
      circle: 'w-8 h-8 text-sm',
      lineWidth: 'w-10 sm:w-16',
      lineHeight: 'h-0.5',
      title: 'text-xs sm:text-sm',
      subtitle: 'text-xs',
      gap: 'gap-1.5',
    },
    lg: {
      circle: 'w-10 h-10 text-base',
      lineWidth: 'w-12 sm:w-20',
      lineHeight: 'h-1',
      title: 'text-sm sm:text-base',
      subtitle: 'text-sm',
      gap: 'gap-2',
    },
  };

  const sizes = sizeClasses[size];
  const isHorizontal = orientation === 'horizontal';

  if (isHorizontal) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id) || index < currentIndex;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <div key={step.id} className="flex items-center">
              {/* Step item */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center ${sizes.gap} ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Circle */}
                <div
                  className={`${sizes.circle} rounded-full flex items-center justify-center font-semibold transition-all duration-300 flex-shrink-0 ${
                    isCompleted
                      ? 'bg-[#C4735B] text-white'
                      : isCurrent
                      ? 'bg-[#C4735B] text-white ring-4 ring-[#C4735B]/20'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Title */}
                {showTitles && (
                  <span
                    className={`${sizes.title} font-medium text-center whitespace-nowrap ${
                      isCurrent || isCompleted
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.title}
                  </span>
                )}
              </button>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`${sizes.lineWidth} ${sizes.lineHeight} mx-2 sm:mx-3 transition-all duration-300 flex-shrink-0 ${
                    index < currentIndex
                      ? 'bg-[#C4735B]'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={`flex flex-col ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id) || index < currentIndex;
        const isCurrent = step.id === currentStep;
        const isClickable = onStepClick && (isCompleted || isCurrent);

        return (
          <div key={step.id} className="flex items-start">
            {/* Circle and line column */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`${sizes.circle} rounded-full flex items-center justify-center font-semibold transition-all duration-300 flex-shrink-0 ${
                  isCompleted
                    ? 'bg-[#C4735B] text-white'
                    : isCurrent
                    ? 'bg-[#C4735B] text-white ring-4 ring-[#C4735B]/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {isCompleted ? (
                  <Check className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
                ) : (
                  index + 1
                )}
              </button>

              {/* Vertical connecting line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-8 my-1 transition-all duration-300 ${
                    index < currentIndex
                      ? 'bg-[#C4735B]'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              )}
            </div>

            {/* Title and subtitle */}
            <div className="flex flex-col ml-3 pt-1">
              <span
                className={`${sizes.title} font-medium ${
                  isCurrent || isCompleted
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-400'
                }`}
              >
                {step.title}
              </span>
              {step.subtitle && (
                <span
                  className={`${sizes.subtitle} ${
                    isCurrent ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  {step.subtitle}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simplified dots-only variant
export interface StepDotsProps {
  /** Total number of steps */
  totalSteps: number;
  /** Current step (0-indexed) */
  currentStep: number;
  /** Size of dots */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

export function StepDots({
  totalSteps,
  currentStep,
  size = 'md',
  className = '',
}: StepDotsProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`${dotSizes[size]} rounded-full transition-all duration-300 ${
            index === currentStep
              ? 'bg-[#C4735B] scale-125'
              : index < currentStep
              ? 'bg-[#C4735B]/50'
              : 'bg-neutral-200 dark:bg-neutral-700'
          }`}
        />
      ))}
    </div>
  );
}
