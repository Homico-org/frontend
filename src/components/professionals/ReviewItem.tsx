'use client';

import { Star } from 'lucide-react';

const getImageUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (path.startsWith('/')) return `${apiUrl}${path}`;
  return `${apiUrl}/uploads/${path}`;
};

export interface Review {
  _id: string;
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
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (locale === 'ka') {
      if (diffDays < 7) return `${diffDays} დღის წინ`;
      if (diffWeeks < 4) return `${diffWeeks} კვირის წინ`;
      return `${diffMonths} თვის წინ`;
    }

    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

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
        {review.clientId.avatar && !review.isAnonymous ? (
          <img
            src={getImageUrl(review.clientId.avatar)}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <span className="text-sm font-semibold text-neutral-500">
              {review.isAnonymous ? '?' : review.clientId.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">
              {displayName}
            </p>
            <div className="flex gap-0.5 flex-shrink-0">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200 dark:text-neutral-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-400 mb-2">
            {formatTimeAgo(review.createdAt)}
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
                    src={getImageUrl(photo)}
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
      <div className="flex justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(avgRating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-neutral-300 dark:text-neutral-700'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-neutral-500">
        {totalReviews} {locale === 'ka' ? 'შეფასება' : 'reviews'}
      </p>
    </div>
  );
}
