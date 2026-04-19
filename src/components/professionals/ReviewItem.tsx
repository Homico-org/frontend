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
  const avatarSrc = review.isAnonymous
    ? undefined
    : review.clientId?.avatar || undefined;

  return (
    <div
      className={`bg-[var(--hm-bg-elevated)] rounded-2xl p-5 shadow-sm border border-[var(--hm-border-subtle)] ${className}`}
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
              <p className="font-semibold text-[var(--hm-fg-primary)] text-sm truncate">
                {displayName}
              </p>
              {/* Source badge */}
              {isExternal ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[var(--hm-info-100)] text-blue-700/30 shrink-0">
                  <Globe className="w-2.5 h-2.5" />
                  {review.externalVerifiedAt ? t('reviews.verified') : t('reviews.external')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[var(--hm-success-100)] text-[var(--hm-success-500)]/30 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Homico
                </span>
              )}
            </div>
            <MultiStarDisplay rating={review.rating} size="sm" />
          </div>
          <p className="text-xs text-[var(--hm-fg-muted)] mb-2">
            {formatTimeAgo(review.createdAt, t)}
            {review.projectTitle && (
              <span className="ml-2 text-[var(--hm-fg-muted)]">
                • {review.projectTitle}
              </span>
            )}
          </p>
          {review.text && (
            <p className="text-sm text-[var(--hm-fg-secondary)]">
              {review.text}
            </p>
          )}
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {review.photos.slice(0, 3).map((photo, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onPhotoClick?.(photo)}
                  className="w-16 h-16 rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--hm-brand-500)] transition-all"
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
                  className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--hm-bg-tertiary)] flex items-center justify-center"
                >
                  <span className="text-sm font-semibold text-[var(--hm-fg-muted)]">
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
      className={`bg-[var(--hm-bg-elevated)] rounded-2xl p-6 shadow-sm border border-[var(--hm-border-subtle)] text-center ${className}`}
    >
      <div className="text-5xl font-bold text-[var(--hm-fg-primary)] mb-2">
        {avgRating.toFixed(1)}
      </div>
      <div className="flex justify-center mb-2">
        <MultiStarDisplay rating={avgRating} size="lg" />
      </div>
      <p className="text-sm text-[var(--hm-fg-muted)]">
        {totalReviews} {t('professional.reviews')}
      </p>
    </div>
  );
}
