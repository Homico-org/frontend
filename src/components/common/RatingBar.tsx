'use client';

interface RatingBarProps {
  rating: number;
  maxRating?: number;
  showValue?: boolean;
  reviewCount?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export default function RatingBar({
  rating,
  maxRating = 5,
  showValue = true,
  reviewCount,
  size = 'sm',
  className = '',
}: RatingBarProps) {
  const percentage = Math.min((rating / maxRating) * 100, 100);

  const sizeClasses = {
    xs: {
      bar: 'w-10 h-1',
      text: 'text-xs',
      gap: 'gap-1',
    },
    sm: {
      bar: 'w-14 h-1.5',
      text: 'text-sm',
      gap: 'gap-1.5',
    },
    md: {
      bar: 'w-20 h-2',
      text: 'text-base',
      gap: 'gap-2',
    },
  };

  const { bar, text, gap } = sizeClasses[size];

  // Color based on rating
  const getBarColor = () => {
    if (rating >= 4.5) return 'bg-[#E07B4F]';
    if (rating >= 4.0) return 'bg-[#E8956A]';
    if (rating >= 3.5) return 'bg-lime-500';
    if (rating >= 3.0) return 'bg-yellow-500';
    if (rating >= 2.0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {showValue && (
        <span className={`font-semibold text-neutral-800 dark:text-neutral-50 ${text}`}>
          {rating.toFixed(1)}
        </span>
      )}
      <div className={`${bar} rounded-full overflow-hidden bg-neutral-200 dark:bg-dark-bg`}>
        <div
          className={`h-full rounded-full transition-all duration-200 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {reviewCount !== undefined && (
        <span className={`text-neutral-400 dark:text-neutral-500 ${text}`}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
