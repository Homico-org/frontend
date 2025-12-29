'use client';

import { FeedItem, FeedItemType } from '@/types';
import { getCategoryLabelStatic } from '@/hooks/useCategoryLabels';
import { storage } from '@/services/storage';
import Link from 'next/link';
import React, { useState, useCallback, useMemo } from 'react';

// Terracotta accent - matching design
const ACCENT_COLOR = '#C4735B';

interface FeedCardProps {
  item: FeedItem;
  onLike?: (likeTargetType?: string, likeTargetId?: string) => void;
  isAuthenticated?: boolean;
  locale?: string;
}

const FeedCard = React.memo(function FeedCard({ item, locale = 'en' }: FeedCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasMultipleImages = item.images.length > 1;
  const isBeforeAfter = item.type === FeedItemType.BEFORE_AFTER && item.beforeImage && item.afterImage;
  const totalImages = item.images.length;

  // Check if this is a new item (created within last 14 days and no rating)
  const isNew = useMemo(() => {
    if (item.pro.rating && item.pro.rating > 0) return false;
    if (!item.createdAt) return true; // Default to new if no date
    const createdDate = new Date(item.createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 14;
  }, [item.pro.rating, item.createdAt]);

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging && e.type !== 'click') return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  // Get category label for the tag
  const getCategoryLabel = () => {
    const category = item.category || 'design';
    return getCategoryLabelStatic(category, locale);
  };

  // Check if pro is premium (if available in the data)
  const isPremium = (item.pro as { isPremium?: boolean })?.isPremium || false;

  return (
    <Link
      href={`/professionals/${item.pro._id}`}
      className="group block"
    >
      {/* Card Container with Game Card Effect */}
      <div className={`game-card-wrapper ${isPremium ? 'game-card-premium' : ''}`}>
        <div className="game-card-content bg-white dark:bg-neutral-900 rounded-xl overflow-hidden shadow-sm transition-all duration-300 border border-neutral-100 dark:border-neutral-800">

        {/* Image Section */}
        <div className="relative">
          {/* Source Badge - Homico Verified or External */}
          {item.isVerified !== undefined && (
            <div className="absolute top-3 left-3 z-10">
              {item.isVerified ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[11px] font-medium shadow-lg backdrop-blur-sm"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.9)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {locale === 'ka' ? 'Homico-ზე' : 'Via Homico'}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium shadow-lg backdrop-blur-sm">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  {locale === 'ka' ? 'გარე პროექტი' : 'External'}
                </div>
              )}
            </div>
          )}

          {isBeforeAfter ? (
            <div
              className="relative w-full aspect-[4/3] cursor-ew-resize select-none bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleSliderMove}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSliderMove(e); }}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              onTouchMove={handleSliderMove}
            >
              <img src={storage.getFeedCardImageUrl(item.afterImage)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                <img src={storage.getFeedCardImageUrl(item.beforeImage)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }} />
              </div>

              {/* Slider handle */}
              <div className="absolute top-0 bottom-0 z-10" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
                <div className="absolute inset-0 w-0.5 bg-white shadow-lg" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* Before/After labels */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 text-white text-[11px] font-medium rounded">
                Before
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-white text-neutral-900 text-[11px] font-medium rounded">
                After
              </div>
            </div>
          ) : (
            <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden">
              {/* Main Image */}
              {!imageError && item.images.length > 0 && item.images[currentImageIndex] ? (
                <img
                  src={storage.getFeedCardImageUrl(item.images[currentImageIndex])}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              )}

              {/* Loading placeholder */}
              {!imageLoaded && !imageError && item.images.length > 0 && (
                <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
              )}

              {/* Image navigation arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {item.images.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content Section - Matching design exactly */}
        <div className="p-4">
          {/* Title Row - Title on left, Rating/New on right */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white leading-tight line-clamp-2">
              {item.title}
            </h3>

            {/* Rating or New badge - matching design */}
            {item.pro.rating && item.pro.rating > 0 ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: ACCENT_COLOR }}>
                  {item.pro.rating.toFixed(1)}
                </span>
              </div>
            ) : isNew ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <svg className="w-4 h-4" style={{ color: ACCENT_COLOR }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: ACCENT_COLOR }}>
                  {locale === 'ka' ? 'ახალი' : 'New'}
                </span>
              </div>
            ) : null}
          </div>

          {/* Description - 2 lines, gray text */}
          {item.description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Bottom Row - Avatar + Name on left, Category tag on right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar - Circle with image or initial */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                {item.pro.avatar ? (
                  <img src={storage.getAvatarUrl(item.pro.avatar, 'sm')} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800">
                    {item.pro.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Name */}
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {item.pro.name}
              </span>
            </div>

            {/* Category Tag - Terracotta outline pill */}
            <span
              className="px-3 py-1 text-xs font-medium rounded-full border flex-shrink-0"
              style={{
                color: ACCENT_COLOR,
                borderColor: ACCENT_COLOR,
                backgroundColor: 'transparent'
              }}
            >
              {getCategoryLabel()}
            </span>
          </div>
        </div>
        </div>
        {/* Premium Ribbon - always visible */}
        {isPremium && (
          <div className="game-card-premium-symbol">
            <div className="premium-diamond-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
});

export default FeedCard;
