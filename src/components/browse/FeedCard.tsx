'use client';

import { FeedItem, FeedItemType } from '@/types';
import { getCategoryLabelStatic } from '@/hooks/useCategoryLabels';
import { storage } from '@/services/storage';
import { StarRating } from '@/components/ui/StarRating';
import Avatar from '@/components/common/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import React, { useState, useCallback, useMemo } from 'react';
import { ACCENT_COLOR } from '@/constants/theme';

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

  const hasVideos = item.videos && item.videos.length > 0;
  const hasMultipleImages = item.images.length > 1 || hasVideos;
  // Support both direct beforeImage/afterImage and beforeAfterPairs array
  const firstBeforeAfterPair = item.beforeAfterPairs?.[0];
  const beforeImage = item.beforeImage || firstBeforeAfterPair?.beforeImage;
  const afterImage = item.afterImage || firstBeforeAfterPair?.afterImage;
  const isBeforeAfter = item.type === FeedItemType.BEFORE_AFTER && beforeImage && afterImage;
  // Combine images and videos for navigation
  const allMedia = [...item.images, ...(item.videos || [])];
  const totalImages = allMedia.length;

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
      href={`/professionals/${item.pro.id}`}
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
              <img src={storage.getFeedCardImageUrl(afterImage)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                <img src={storage.getFeedCardImageUrl(beforeImage)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }} />
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
              {/* Main Image or Video */}
              {!imageError && allMedia.length > 0 && allMedia[currentImageIndex] ? (
                (() => {
                  const currentMedia = allMedia[currentImageIndex];
                  const isVideo = currentMedia.includes('.mp4') || currentMedia.includes('.mov') || currentMedia.includes('.webm') || currentMedia.startsWith('data:video');

                  if (isVideo) {
                    return (
                      <>
                        <video
                          src={storage.getFeedCardImageUrl(currentMedia)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                          onMouseEnter={(e) => e.currentTarget.play()}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                        {/* Video play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    );
                  }

                  return (
                    <img
                      src={storage.getFeedCardImageUrl(currentMedia)}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              )}

              {/* Loading placeholder */}
              {!imageLoaded && !imageError && allMedia.length > 0 && (
                <Skeleton className="absolute inset-0" />
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
                    {allMedia.slice(0, 5).map((_, idx) => (
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
              <StarRating
                rating={item.pro.rating}
                size="sm"
                starColor={ACCENT_COLOR}
                className="flex-shrink-0 [&>span]:!text-[#C4735B]"
              />
            ) : isNew ? (
              <StatusPill variant="new" size="sm" locale={locale as 'en' | 'ka'} />
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
              <Avatar
                src={item.pro.avatar}
                name={item.pro.name}
                size="sm"
              />
              {/* Name */}
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {item.pro.name}
              </span>
            </div>

            {/* Category Tag - Terracotta outline pill */}
            <Badge variant="outline" size="sm" className="flex-shrink-0">
              {getCategoryLabel()}
            </Badge>
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
