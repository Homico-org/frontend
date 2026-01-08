'use client';

import Avatar from '@/components/common/Avatar';
import { MultiStarDisplay } from '@/components/ui/StarRating';
import { storage } from '@/services/storage';
import { formatTimeAgo } from '@/utils/dateUtils';

export interface Review {
  id: string;
  clientId: {
    name: string;
    avatar?: string;
    city?: string;
  };
  rating: number;
  text?: string;
  photos?: string[];
  createdAt: string;
  projectTitle?: string;
  isAnonymous?: boolean;
}

export interface ReviewItemProps {
  /** Review data */
  review: Review;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Handler for opening a photo */
  onPhotoClick?: (photo: string) => void;
  /** Custom className */
  className?: string;
}

export default function ReviewItem({
  review,
  locale = 'en',
  onPhotoClick,
  className = '',
}: ReviewItemProps) {
  const displayName = review.isAnonymous
    ? locale === 'ka'
      ? 'ანონიმური'
      : 'Anonymous'
    : review.clientId.name;

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 ${className}`}
    >
      <div className="flex items-start gap-4">
        <Avatar
          src={review.isAnonymous ? undefined : review.clientId.avatar}
          name={review.isAnonymous ? '?' : review.clientId.name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">
              {displayName}
            </p>
            <MultiStarDisplay rating={review.rating} size="sm" />
          </div>
          <p className="text-xs text-neutral-400 mb-2">
            {formatTimeAgo(review.createdAt, locale)}
          </p>
          {review.text && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {review.text}
            </p>
          )}
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {review.photos.slice(0, 3).map((photo, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onPhotoClick?.(photo)}
                  className="w-16 h-16 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#C4735B] transition-all"
                >
                  <img
                    src={storage.getFileUrl(photo)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              {review.photos.length > 3 && (
                <button
                  onClick={() => onPhotoClick?.(review.photos![3])}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                >
                  <span className="text-sm font-semibold text-neutral-500">
                    +{review.photos.length - 3}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface RatingSummaryProps {
  /** Average rating */
  avgRating: number;
  /** Total number of reviews */
  totalReviews: number;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
}

export function RatingSummary({
  avgRating,
  totalReviews,
  locale = 'en',
  className = '',
}: RatingSummaryProps) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 text-center ${className}`}
    >
      <div className="text-5xl font-bold text-neutral-900 dark:text-white mb-2">
        {avgRating.toFixed(1)}
      </div>
      <div className="flex justify-center mb-2">
        <MultiStarDisplay rating={avgRating} size="lg" />
      </div>
      <p className="text-sm text-neutral-500">
        {totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'}
      </p>
    </div>
  );
}
