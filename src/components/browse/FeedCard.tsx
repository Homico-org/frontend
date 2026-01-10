'use client';

import Avatar from '@/components/common/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarRating } from '@/components/ui/StarRating';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/badge';
import { ACCENT_COLOR } from '@/constants/theme';
import { getCategoryLabelStatic } from '@/hooks/useCategoryLabels';
import { storage } from '@/services/storage';
import { FeedItem, FeedItemType } from '@/types';
import { BadgeCheck, ChevronLeft, ChevronRight, Globe, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';

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

  // Handle both id and _id for pro (backend may return either)
  const proId = item.pro.id || (item.pro as { _id?: string })._id;

  return (
    <Link
      href={`/professionals/${proId}`}
      className="group block"
    >
      {/* Card Container with Premium Effects */}
      <div className={`relative transition-all duration-500 ${isPremium ? 'game-card-premium' : ''}`}>
        {/* Premium border glow effect */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/30 group-hover:via-[#D4937B]/15 group-hover:to-[#C4735B]/30 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />
        
        {/* Main Card */}
        <div className="relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100/80 dark:border-neutral-800 group-hover:border-[#C4735B]/20 transition-all duration-500 group-hover:shadow-[0_20px_50px_-12px_rgba(196,115,91,0.15)] group-hover:-translate-y-0.5">
          
          {/* Shine effect overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          </div>

          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C4735B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

          {/* Image Section */}
          <div className="relative">
            {/* Source Badge - Homico Verified or External */}
            {item.isVerified !== undefined && (
              <div className="absolute top-3 left-3 z-20">
                {item.isVerified ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-semibold shadow-lg border border-white/20">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {locale === 'ka' ? 'Homico-ზე' : 'Via Homico'}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-medium shadow-lg border border-white/10">
                    <Globe className="w-3.5 h-3.5" />
                    {locale === 'ka' ? 'გარე პროექტი' : 'External'}
                  </div>
                )}
              </div>
            )}

            {isBeforeAfter ? (
              <div
                className="relative w-full aspect-[4/3] cursor-ew-resize select-none bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleSliderMove}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSliderMove(e); }}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onTouchMove={handleSliderMove}
              >
                <Image src={storage.getFeedCardImageUrl(afterImage)} alt="After" fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" priority={false} />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={storage.getFeedCardImageUrl(beforeImage)} alt="Before" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }} />
                </div>

                {/* Slider handle - enhanced */}
                <div className="absolute top-0 bottom-0 z-10" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
                  <div className="absolute inset-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-[#C4735B]/20">
                    <div className="flex items-center gap-0.5">
                      <ChevronLeft className="w-3 h-3 text-neutral-500" />
                      <ChevronRight className="w-3 h-3 text-neutral-500" />
                    </div>
                  </div>
                </div>

                {/* Before/After labels - enhanced */}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full">
                  {locale === 'ka' ? 'მდე' : 'Before'}
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-neutral-900 text-[11px] font-semibold rounded-full shadow-lg">
                  {locale === 'ka' ? 'შემდეგ' : 'After'}
                </div>
              </div>
            ) : (
              <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
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
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          />
                          {/* Video play icon overlay - enhanced */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
                              <Play className="w-6 h-6 text-white ml-0.5 fill-white" />
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
                        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                      />
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700">
                    <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}

                {/* Loading placeholder */}
                {!imageLoaded && !imageError && allMedia.length > 0 && (
                  <Skeleton className="absolute inset-0" />
                )}

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Image navigation arrows - enhanced */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-white hover:scale-110"
                    >
                      <ChevronLeft className="w-5 h-5 text-neutral-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-white hover:scale-110"
                    >
                      <ChevronRight className="w-5 h-5 text-neutral-700" />
                    </button>

                    {/* Image dots indicator - enhanced */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                      {allMedia.slice(0, 5).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'
                          }`}
                        />
                      ))}
                      {allMedia.length > 5 && (
                        <span className="text-[10px] text-white/70 ml-0.5">+{allMedia.length - 5}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4">
            {/* Title Row with animated underline */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="relative min-w-0 flex-1">
                <h3 className="font-semibold text-base text-neutral-900 dark:text-white leading-tight line-clamp-2 group-hover:text-[#C4735B] transition-colors duration-300">
                  {item.title}
                </h3>
                {/* Animated underline */}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C4735B] via-[#D4937B] to-[#C4735B] group-hover:w-full transition-all duration-500 ease-out rounded-full" />
              </div>

              {/* Rating or New badge */}
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

            {/* Description */}
            {item.description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Bottom Row - Avatar + Name on left, Category tag on right */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 group/pro">
                {/* Avatar with hover ring */}
                <div className="relative">
                  <Avatar
                    src={item.pro.avatar}
                    name={item.pro.name}
                    size="sm"
                  />
                  <div className="absolute -inset-0.5 rounded-full border-2 border-transparent group-hover/pro:border-[#C4735B]/30 transition-all duration-300" />
                </div>
                {/* Name with hover color */}
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate group-hover/pro:text-[#C4735B] transition-colors duration-300">
                  {item.pro.name}
                </span>
              </div>

              {/* Category Tag */}
              <Badge variant="outline" size="sm" className="flex-shrink-0 group-hover:border-[#C4735B]/50 group-hover:text-[#C4735B] transition-all duration-300">
                {getCategoryLabel()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Premium Ribbon */}
        {isPremium && (
          <div className="absolute -top-1 -right-1 z-20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
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
