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

  // Modern minimal default: a small filled dark-ink star (no amber), paired
  // with a bold number that does the actual carrying. Callers can still pass
  // `starColor` to opt back into a tinted star (e.g. amber for hero badges).
  const starStyle: React.CSSProperties = starColor
    ? { fill: starColor, color: starColor }
    : { fill: 'var(--hm-fg-primary)', color: 'var(--hm-fg-primary)' };
  return (
    <div className={cn('inline-flex items-center', config.gap, className)}>
      <Star
        className={config.star}
        strokeWidth={1.75}
        style={starStyle}
      />
      {showValue && (
        <span className={cn(config.text, 'font-semibold text-[var(--hm-fg-primary)] tabular-nums')}>
          {displayRating}
        </span>
      )}
      {showCount && displayCount && (
        <span className={cn(config.count, 'text-[var(--hm-fg-muted)] tabular-nums')}>
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
            className={config.star}
            strokeWidth={1.75}
            style={
              starValue <= value
                ? { fill: 'var(--hm-brand-500)', color: 'var(--hm-brand-500)' }
                : { fill: 'transparent', color: 'var(--hm-border-strong)' }
            }
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
      {Array.from({ length: max }, (_, i) => {
        const isFull = i < Math.floor(rating);
        const isHalf = !isFull && i < rating;
        return (
          <Star
            key={i}
            className={config.star}
            strokeWidth={1.75}
            style={
              isFull
                ? { fill: 'var(--hm-fg-primary)', color: 'var(--hm-fg-primary)' }
                : isHalf
                  ? { fill: 'var(--hm-fg-primary)', color: 'var(--hm-fg-primary)', opacity: 0.5 }
                  : { fill: 'transparent', color: 'var(--hm-border-strong)' }
            }
          />
        );
      })}
    </div>
  );
}

export default StarRating;
