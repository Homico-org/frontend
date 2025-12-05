'use client';

import LikeButton from '@/components/common/LikeButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeedItem, FeedItemType } from '@/types';
import Link from 'next/link';
import { useState, useCallback } from 'react';

interface FeedCardProps {
  item: FeedItem;
  onLike?: () => void;
}

export default function FeedCard({ item, onLike }: FeedCardProps) {
  const { locale } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

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

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return locale === 'ka' ? 'დღეს' : 'Today';
    if (diffDays === 1) return locale === 'ka' ? 'გუშინ' : 'Yesterday';
    if (diffDays < 7) return locale === 'ka' ? `${diffDays} დღის წინ` : `${diffDays}d`;
    if (diffDays < 30) return locale === 'ka' ? `${Math.floor(diffDays / 7)} კვ.` : `${Math.floor(diffDays / 7)}w`;
    return locale === 'ka' ? `${Math.floor(diffDays / 30)} თვ.` : `${Math.floor(diffDays / 30)}mo`;
  };

  return (
    <div className="group relative bg-[var(--color-bg-primary)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {isBeforeAfter ? (
          /* Before/After Comparison Slider */
          <div
            className="relative w-full h-full cursor-ew-resize select-none"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleSliderMove}
            onClick={handleSliderMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onTouchMove={handleSliderMove}
          >
            {/* After Image (Background) */}
            <img
              src={item.afterImage}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Before Image (Clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={item.beforeImage}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
              />
            </div>

            {/* Slider Line - Bold and visible */}
            <div
              className="absolute top-0 bottom-0 z-20"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              {/* Glowing line effect */}
              <div className="absolute inset-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8),0_0_40px_rgba(255,255,255,0.4)]" />

              {/* Main line with gradient */}
              <div className="absolute inset-0 w-1 bg-gradient-to-b from-white via-white to-white">
                {/* Top accent */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                {/* Bottom accent */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
              </div>

              {/* Slider Handle - Prominent circular grip */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center border-2 border-white/50 backdrop-blur-sm">
                {/* Inner circle with arrows */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center gap-0.5 shadow-inner">
                  {/* Left arrow */}
                  <svg className="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                  {/* Divider */}
                  <div className="w-px h-4 bg-zinc-300" />
                  {/* Right arrow */}
                  <svg className="w-3 h-3 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Labels - High contrast badges */}
            <div className="absolute top-3 left-3 z-10">
              <div className="px-3 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase shadow-lg border border-white/10">
                {locale === 'ka' ? 'მანამდე' : 'Before'}
              </div>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-zinc-900 text-[10px] font-bold tracking-wider uppercase shadow-lg border border-black/5">
                {locale === 'ka' ? 'შემდეგ' : 'After'}
              </div>
            </div>

            {/* Drag hint - appears briefly */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-medium flex items-center gap-1.5 opacity-70 pointer-events-none">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span>{locale === 'ka' ? 'გადაათრიე' : 'Drag to compare'}</span>
            </div>
          </div>
        ) : (
          /* Regular Image Display with Slider */
          <div className="relative w-full h-full">
            {/* Image with fade transition */}
            <div className="relative w-full h-full">
              <img
                src={item.images[currentImageIndex] || '/placeholder.jpg'}
                alt={item.title}
                className={`w-full h-full object-cover transition-all duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsImageLoaded(true)}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
              )}
            </div>

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Previous image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Right Arrow */}
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Next image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium tabular-nums">
                  {currentImageIndex + 1} / {totalImages}
                </div>

                {/* Progress Dots */}
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {item.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        idx === currentImageIndex
                          ? 'w-4 bg-white'
                          : 'w-1 bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Like Button */}
        <div className="absolute top-3 right-3 z-10">
          <LikeButton
            isLiked={item.isLiked}
            likeCount={item.likeCount}
            onToggle={onLike || (() => {})}
            variant="overlay"
            size="md"
          />
        </div>

        {/* Pro Info Overlay */}
        <Link
          href={`/professionals/${item.pro._id}`}
          className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 group/pro"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/40 flex-shrink-0 transition-transform duration-200 group-hover/pro:scale-105">
            {item.pro.avatar ? (
              <img
                src={item.pro.avatar}
                alt={item.pro.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                style={{
                  background: `linear-gradient(135deg, hsl(${(item.pro.name.charCodeAt(0) * 7) % 360}, 65%, 50%) 0%, hsl(${(item.pro.name.charCodeAt(0) * 7 + 40) % 360}, 55%, 40%) 100%)`,
                }}
              >
                {item.pro.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-semibold text-white truncate group-hover/pro:underline decoration-white/50">
              {item.pro.name}
            </h4>
            <div className="flex items-center gap-1.5">
              {item.pro.rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[11px] text-white/90 font-medium">
                    {item.pro.rating.toFixed(1)}
                  </span>
                </div>
              )}
              {item.pro.title && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-[11px] text-white/70 truncate">
                    {item.pro.title}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Content Section - Compact */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-[var(--color-text-primary)] text-[15px] line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
            {item.title}
          </h3>
          <span className="text-[11px] text-[var(--color-text-tertiary)] whitespace-nowrap mt-0.5">
            {formatTimeAgo(item.createdAt)}
          </span>
        </div>

        {item.description && (
          <p className="text-[13px] text-[var(--color-text-secondary)] line-clamp-1 mt-1">
            {item.description}
          </p>
        )}

        {/* Rating Stars - compact inline display */}
        {item.rating && item.rating > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < item.rating! ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {item.client?.name && (
              <span className="text-[11px] text-[var(--color-text-tertiary)] ml-1">
                {locale === 'ka' ? 'კლიენტი:' : 'by'} {item.client.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
