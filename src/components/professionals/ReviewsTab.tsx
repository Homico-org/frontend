'use client';

import { Star } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import ReviewItem, { Review, RatingSummary } from './ReviewItem';

export interface ReviewsTabProps {
  /** List of reviews */
  reviews: Review[];
  /** Average rating */
  avgRating: number;
  /** Total number of reviews */
  totalReviews: number;
  /** Handler when a photo is clicked */
  onPhotoClick?: (photo: string) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
}

export default function ReviewsTab({
  reviews,
  avgRating,
  totalReviews,
  onPhotoClick,
  locale = 'en',
}: ReviewsTabProps) {
  const { t } = useLanguage();
  if (reviews.length === 0) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500">
            {t('professional.noReviewsYet')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="space-y-4">
        {/* Rating Summary */}
        {avgRating > 0 && (
          <RatingSummary
            avgRating={avgRating}
            totalReviews={totalReviews}
            locale={locale}
          />
        )}

        {/* Reviews List */}
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            locale={locale}
            onPhotoClick={onPhotoClick}
          />
        ))}
      </div>
    </div>
  );
}

