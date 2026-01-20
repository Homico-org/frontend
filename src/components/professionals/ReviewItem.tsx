'use client';

import Avatar from '@/components/common/Avatar';
import { MultiStarDisplay } from '@/components/ui/StarRating';
import { storage } from '@/services/storage';
import { formatTimeAgo } from '@/utils/dateUtils';
import { ShieldCheck, Globe } from 'lucide-react';

import { useLanguage } from "@/contexts/LanguageContext";
export interface Review {
  id: string;
  clientId?: {
    id?: string;
    _id?: string;
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
  // External review fields
  source?: 'homico' | 'external';
  externalClientName?: string;
  externalClientPhone?: string;
  externalVerifiedAt?: string;
  isVerified?: boolean;
}

export interface ReviewItemProps {
  /** Review data */
  review: Review;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
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
  const { t } = useLanguage();
  
  // Determine display name based on source and anonymity
  const isExternal = review.source === 'external';
  const displayName = review.isAnonymous
    ? t('common.anonymous')
    : isExternal
      ? (review.externalClientName || t('common.anonymous'))
      : review.clientId?.name || t('common.anonymous');

  // Determine avatar
  const avatarName = review.isAnonymous 
    ? '?' 
    : isExternal 
      ? (review.externalClientName || '?')
      : (review.clientId?.name || '?');
  const avatarSrc = review.isAnonymous || isExternal 
    ? undefined 
    : review.clientId?.avatar;

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 ${className}`}
    >
      <div className="flex items-start gap-4">
        <Avatar
          src={avatarSrc}
          name={avatarName}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">
                {displayName}
              </p>
              {/* Source badge */}
              {isExternal ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                  <Globe className="w-2.5 h-2.5" />
                  {review.externalVerifiedAt ? t('reviews.verified') : t('reviews.external')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Homico
                </span>
              )}
            </div>
            <MultiStarDisplay rating={review.rating} size="sm" />
          </div>
          <p className="text-xs text-neutral-400 mb-2">
            {formatTimeAgo(review.createdAt, locale)}
            {review.projectTitle && (
              <span className="ml-2 text-neutral-500">
                • {review.projectTitle}
              </span>
            )}
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
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

export function RatingSummary({
  avgRating,
  totalReviews,
  locale = 'en',
  className = '',
}: RatingSummaryProps) {
  const { t } = useLanguage();
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
        {totalReviews} {t('professional.reviews')}
      </p>
    </div>
  );
}
