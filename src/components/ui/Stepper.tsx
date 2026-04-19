'use client';

import { cn } from '@/lib/utils';

/**
 * Homico Design System — Stepper
 *
 * Thin 3px bars in a grid layout. Mono step numbers, minimal labels.
 * States: inactive (50% opacity, n-200 bar), active (brand-500 bar),
 * done (n-900 bar, full opacity).
 *
 * Usage:
 *   <Stepper steps={steps} currentIndex={1} onStepClick={goTo} />
 */

export interface StepperStep {
  key: string;
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentIndex,
  onStepClick,
  className,
}: StepperProps): React.ReactElement {
  return (
    <div
      className={cn('grid gap-1.5', className)}
      style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
    >
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isClickable = onStepClick && isDone;

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => isClickable && onStepClick(index)}
            disabled={!isClickable}
            className={cn(
              'flex flex-col gap-[5px] p-0 bg-transparent border-0 text-left transition-opacity',
              isActive || isDone ? 'opacity-100' : 'opacity-50',
              isClickable ? 'cursor-pointer' : 'cursor-default',
            )}
            style={{ transitionDuration: 'var(--hm-dur-base, 220ms)' }}
          >
            {/* Bar */}
            <div
              className="h-[3px] w-full transition-colors"
              style={{
                transitionDuration: 'var(--hm-dur-base, 220ms)',
                backgroundColor: isDone
                  ? 'var(--hm-n-900)'
                  : isActive
                    ? 'var(--hm-brand-500)'
                    : 'var(--hm-n-200)',
              }}
            />

            {/* Step number */}
            <span
              className="text-[9.5px] uppercase tracking-[0.16em]"
              style={{
                fontFamily: 'var(--hm-font-mono)',
                color: isActive
                  ? 'var(--hm-brand-500)'
                  : 'var(--hm-fg-muted)',
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* Label */}
            <span
              className="text-[11.5px] font-medium leading-tight"
              style={{
                letterSpacing: '-0.005em',
                color: 'var(--hm-fg-primary)',
              }}
            >
              {step.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact variant — bars only, no labels. For tight spaces.
 */
export interface StepperBarsProps {
  total: number;
  currentIndex: number;
  className?: string;
}

export function StepperBars({
  total,
  currentIndex,
  className,
}: StepperBarsProps): React.ReactElement {
  return (
    <div
      className={cn('grid gap-1.5', className)}
      style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}
    >
      {Array.from({ length: total }, (_, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div
            key={index}
            className="h-[3px] w-full transition-colors"
            style={{
              transitionDuration: 'var(--hm-dur-base, 220ms)',
              backgroundColor: isDone
                ? 'var(--hm-n-900)'
                : isActive
                  ? 'var(--hm-brand-500)'
                  : 'var(--hm-n-200)',
            }}
          />
        );
      })}
    </div>
  );
}
