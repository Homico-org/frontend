'use client';

import LikeButton from '@/components/common/LikeButton';
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
  const [imageLoaded, setImageLoaded] = useState(false);

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
    <Link
      href={`/professionals/${item.pro._id}`}
      className="group block feed-card-premium overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#E07B4F]/5 to-[#E8956A]/10">
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

            {/* Slider handle */}
            <div className="absolute top-0 bottom-0 z-20" style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}>
              <div className="absolute inset-0 w-0.5 bg-white/90 shadow-lg" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-[#E07B4F]/20">
                <svg className="w-4 h-4 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Before/After labels */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wider">
              მანამდე
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#E07B4F] to-[#D26B3F] text-white text-[10px] font-semibold uppercase tracking-wider shadow-lg shadow-[#E07B4F]/30">
              შემდეგ
            </div>
          </div>
        ) : (
          <>
            {!imageError ? (
              <img
                src={item.images[currentImageIndex]}
                alt={item.title}
                className={`
                  w-full h-full object-cover
                  transition-all duration-700 ease-out
                  group-hover:scale-105
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#E07B4F]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}

            {/* Loading shimmer */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 shimmer-premium" />
            )}

            {/* Image navigation for multiple images */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                    bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100
                    transition-all duration-300 hover:scale-110
                    border border-[#E07B4F]/10 shadow-lg
                    z-20"
                >
                  <svg className="w-4 h-4 text-[#E07B4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                    bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100
                    transition-all duration-300 hover:scale-110
                    border border-[#E07B4F]/10 shadow-lg
                    z-20"
                >
                  <svg className="w-4 h-4 text-[#E07B4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image counter pill */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2
                  px-3 py-1.5 rounded-full
                  bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                  text-[11px] font-bold text-[#E07B4F]
                  border border-[#E07B4F]/10 shadow-md
                  z-20">
                  {currentImageIndex + 1} / {totalImages}
                </div>
              </>
            )}
          </>
        )}

        {/* Like button */}
        {isAuthenticated && !isBeforeAfter && (
          <div className="absolute top-3 right-3 z-20" onClick={(e) => e.preventDefault()}>
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

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Footer Section */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          {/* Pro avatar with ring */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-2 ring-[#E07B4F]/10 ring-offset-2 ring-offset-white dark:ring-offset-[#323236]">
              {item.pro.avatar ? (
                <img src={item.pro.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-[#E07B4F] to-[#D26B3F]">
                  {item.pro.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#323236]" />
          </div>

          {/* Title and Pro info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[#E07B4F] transition-colors duration-300">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs sm:text-sm text-[var(--color-text-tertiary)] truncate">
                {item.pro.name}
              </p>
              {item.pro.rating > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-xs">
                  <svg className="w-3.5 h-3.5 text-[#E07B4F] star-glow" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold text-[var(--color-text-secondary)]">
                    {item.pro.rating.toFixed(1)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E07B4F]/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
            <svg className="w-4 h-4 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
