'use client';

import { cn } from '@/lib/utils';
import { ACCENT_COLOR } from '@/constants/theme';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom color (defaults to accent color) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Variant: svg (default) or border */
  variant?: 'svg' | 'border';
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * A reusable loading spinner component
 *
 * @example
 * // SVG spinner (default)
 * <LoadingSpinner size="md" />
 *
 * // Border spinner (CSS-based, lighter weight)
 * <LoadingSpinner size="sm" variant="border" color="white" />
 */
export function LoadingSpinner({
  size = 'md',
  color,
  className,
  variant = 'svg',
}: LoadingSpinnerProps) {
  if (variant === 'border') {
    return (
      <div
        className={cn(
          'rounded-full animate-spin border-2',
          sizeMap[size],
          className
        )}
        style={{
          borderColor: color ? `${color}30` : 'currentColor',
          borderTopColor: color || 'currentColor',
          opacity: color ? undefined : 0.3,
        }}
      />
    );
  }

  return (
    <svg
      className={cn('animate-spin', sizeMap[size], className)}
      style={color ? { color } : undefined}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * A centered loading spinner for full-page or container loading states
 */
export function LoadingSpinnerCentered({
  size = 'lg',
  color = ACCENT_COLOR,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <LoadingSpinner size={size} color={color} />
    </div>
  );
}

export default LoadingSpinner;
