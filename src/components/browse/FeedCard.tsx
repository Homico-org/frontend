'use client';

import LikeButton from '@/components/common/LikeButton';
import Card, { CardImage, CardContent, CardBadge } from '@/components/common/Card';
import { FeedItem, FeedItemType } from '@/types';
import Link from 'next/link';
import { useState, useCallback } from 'react';

interface FeedCardProps {
  item: FeedItem;
  onLike?: () => void;
  isAuthenticated?: boolean;
}

export default function FeedCard({ item, onLike, isAuthenticated = false }: FeedCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasMultipleImages = item.images.length > 1;
  const isBeforeAfter = item.type === FeedItemType.BEFORE_AFTER && item.beforeImage && item.afterImage;
  const totalImages = item.images.length;

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

  return (
    <Card href={`/professionals/${item.pro._id}`} variant="default" hover="lift" className="group">
      {/* Image Section */}
      <CardImage aspectRatio="4/3">
        {isBeforeAfter ? (
          <div
            className="relative w-full h-full cursor-ew-resize select-none"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleSliderMove}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSliderMove(e); }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onTouchMove={handleSliderMove}
          >
            <img src={item.afterImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
              <img src={item.beforeImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }} />
            </div>
            <div className="absolute top-0 bottom-0 z-20" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
              <div className="absolute inset-0 w-0.5 bg-white/80" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center">
                <svg className="w-3 h-3 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
            {/* Before/After labels */}
            <CardBadge position="top-left" variant="glass" color="neutral" className="!bg-black/50 !text-white !border-0">
              მანამდე
            </CardBadge>
            <CardBadge position="top-right" variant="solid" color="primary">
              შემდეგ
            </CardBadge>
          </div>
        ) : (
          <>
            {!imageError ? (
              <img
                src={item.images[currentImageIndex]}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D2691E]/5 to-[#CD853F]/10">
                <svg className="w-12 h-12 text-[#D2691E]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
            {hasMultipleImages && (
              <>
                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-[#D2691E]/10">
                  <svg className="w-3.5 h-3.5 text-[#D2691E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-[#D2691E]/10">
                  <svg className="w-3.5 h-3.5 text-[#D2691E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-[#D2691E] text-[10px] font-semibold z-20 border border-[#D2691E]/10">
                  {currentImageIndex + 1} / {totalImages}
                </div>
              </>
            )}
          </>
        )}

        {/* Like button - top right (only if not before/after, since that uses badges) */}
        {isAuthenticated && !isBeforeAfter && (
          <div className="absolute top-2 right-2 z-20" onClick={(e) => e.preventDefault()}>
            <LikeButton
              isLiked={item.isLiked}
              likeCount={item.likeCount}
              onToggle={onLike || (() => {})}
              variant="minimal"
              size="sm"
              showCount={false}
            />
          </div>
        )}
      </CardImage>

      {/* Footer - using CardContent for consistency */}
      <CardContent spacing="tight">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pro avatar */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[#D2691E]/20">
            {item.pro.avatar ? (
              <img src={item.pro.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-[10px] sm:text-xs font-medium bg-gradient-to-br from-[#D2691E] to-[#CD853F]">
                {item.pro.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Title and Pro name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[#D2691E] transition-colors">
              {item.title}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] truncate">
              {item.pro.name}
              {item.pro.rating > 0 && (
                <span className="hidden sm:inline-flex items-center ml-1.5">
                  <svg className="w-3 h-3 text-amber-500 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {item.pro.rating.toFixed(1)}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
