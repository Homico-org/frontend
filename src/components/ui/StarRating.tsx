'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRating, formatReviewCountCompact } from '@/utils/ratingUtils';

export type StarRatingSize = 'xs' | 'sm' | 'md' | 'lg';

interface StarRatingProps {
  /** Rating value (0-5) */
  rating: number | undefined | null;
  /** Number of reviews */
  reviewCount?: number;
  /** Whether to show the numeric rating */
  showValue?: boolean;
  /** Whether to show the review count */
  showCount?: boolean;
  /** Size variant */
  size?: StarRatingSize;
  /** Additional class names */
  className?: string;
  /** Custom star color (defaults to amber) */
  starColor?: string;
}

// Size configurations
const sizeConfig: Record<StarRatingSize, {
  star: string;
  text: string;
  count: string;
  gap: string;
}> = {
  xs: { star: 'w-3 h-3', text: 'text-xs', count: 'text-[10px]', gap: 'gap-0.5' },
  sm: { star: 'w-3.5 h-3.5', text: 'text-xs', count: 'text-xs', gap: 'gap-1' },
  md: { star: 'w-4 h-4', text: 'text-sm', count: 'text-xs', gap: 'gap-1' },
  lg: { star: 'w-5 h-5', text: 'text-base', count: 'text-sm', gap: 'gap-1.5' },
};

/**
 * Reusable star rating display component.
 * Shows a filled star icon with optional rating value and review count.
 *
 * @example
 * // Simple star with rating
 * <StarRating rating={4.8} />
 *
 * // With review count
 * <StarRating rating={4.8} reviewCount={128} showCount />
 *
 * // Large size without value
 * <StarRating rating={4.5} size="lg" showValue={false} />
 */
export function StarRating({
  rating,
  reviewCount,
  showValue = true,
  showCount = false,
  size = 'sm',
  className,
  starColor,
}: StarRatingProps) {
  const config = sizeConfig[size];
  const displayRating = formatRating(rating);
  const displayCount = formatReviewCountCompact(reviewCount);

  return (
    <div className={cn('inline-flex items-center', config.gap, className)}>
      <Star
        className={cn(config.star, 'fill-amber-400 text-amber-400')}
        style={starColor ? { fill: starColor, color: starColor } : undefined}
      />
      {showValue && (
        <span className={cn(config.text, 'font-semibold text-neutral-900 dark:text-white')}>
          {displayRating}
        </span>
      )}
      {showCount && displayCount && (
        <span className={cn(config.count, 'text-neutral-500 dark:text-neutral-400')}>
          {displayCount}
        </span>
      )}
    </div>
  );
}

interface StarRatingInputProps {
  /** Current rating value */
  value: number;
  /** Callback when rating changes */
  onChange: (rating: number) => void;
  /** Maximum rating (default 5) */
  max?: number;
  /** Size variant */
  size?: StarRatingSize;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Interactive star rating input component.
 *
 * @example
 * const [rating, setRating] = useState(0);
 * <StarRatingInput value={rating} onChange={setRating} />
 */
export function StarRatingInput({
  value,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  className,
}: StarRatingInputProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((starValue) => (
        <button
          key={starValue}
          type="button"
          onClick={() => !disabled && onChange(starValue)}
          disabled={disabled}
          className={cn(
            'transition-transform hover:scale-110 focus:outline-none focus:scale-110',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <Star
            className={cn(
              config.star,
              starValue <= value
                ? 'fill-amber-400 text-amber-400'
                : 'fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700'
            )}
          />
        </button>
      ))}
    </div>
  );
}

interface MultiStarDisplayProps {
  /** Rating value (0-5) */
  rating: number;
  /** Maximum stars (default 5) */
  max?: number;
  /** Size variant */
  size?: StarRatingSize;
  /** Additional class names */
  className?: string;
}

/**
 * Display multiple stars based on rating (filled/unfilled).
 *
 * @example
 * <MultiStarDisplay rating={4.5} />
 */
export function MultiStarDisplay({
  rating,
  max = 5,
  size = 'sm',
  className,
}: MultiStarDisplayProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            config.star,
            i < Math.floor(rating)
              ? 'fill-amber-400 text-amber-400'
              : i < rating
              ? 'fill-amber-400/50 text-amber-400/50'
              : 'fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700'
          )}
        />
      ))}
    </div>
  );
}

export default StarRating;
