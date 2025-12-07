'use client';

import LikeButton from '@/components/common/LikeButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeedItem, FeedItemType } from '@/types';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { CATEGORIES } from '@/constants/categories';

interface FeedCardProps {
  item: FeedItem;
  onLike?: () => void;
  isAuthenticated?: boolean;
}

export default function FeedCard({ item, onLike, isAuthenticated = false }: FeedCardProps) {
  const { locale } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const hasMultipleImages = item.images.length > 1;

  // Get localized category name
  const getCategoryLabel = (categoryKey: string) => {
    const category = CATEGORIES.find(c => c.key === categoryKey);
    if (category) {
      return locale === 'ka' ? category.nameKa : category.name;
    }
    // Fallback: format the key nicely
    return categoryKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
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

  const getTypeLabel = () => {
    switch (item.type) {
      case FeedItemType.COMPLETION:
        return locale === 'ka' ? 'დასრულებული' : 'Completed';
      case FeedItemType.BEFORE_AFTER:
        return locale === 'ka' ? 'მანამდე/შემდეგ' : 'Before/After';
      case FeedItemType.PORTFOLIO:
        return locale === 'ka' ? 'პორტფოლიო' : 'Portfolio';
      case FeedItemType.PRO_HIGHLIGHT:
        return locale === 'ka' ? 'გამორჩეული' : 'Highlight';
      default:
        return '';
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case FeedItemType.COMPLETION:
        return 'bg-emerald-500 text-white';
      case FeedItemType.BEFORE_AFTER:
        return 'bg-purple-500 text-white';
      case FeedItemType.PORTFOLIO:
        return 'bg-blue-500 text-white';
      case FeedItemType.PRO_HIGHLIGHT:
        return 'bg-amber-500 text-white';
      default:
        return 'bg-zinc-500 text-white';
    }
  };

  return (
    <div className="group relative bg-[var(--color-bg-primary)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-all duration-300 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20">
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

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 z-20"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              <div className="absolute inset-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />

              {/* Slider Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center gap-0.5 shadow-inner">
                  <svg className="w-2.5 h-2.5 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                  <div className="w-px h-3.5 bg-zinc-300" />
                  <svg className="w-2.5 h-2.5 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Before/After Labels */}
            <div className="absolute top-3 left-3 z-10">
              <div className="px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wide">
                {locale === 'ka' ? 'მანამდე' : 'Before'}
              </div>
            </div>
            <div className="absolute top-3 right-14 z-10">
              <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-zinc-900 text-[10px] font-bold uppercase tracking-wide">
                {locale === 'ka' ? 'შემდეგ' : 'After'}
              </div>
            </div>
          </div>
        ) : (
          /* Regular Image Display */
          <div className="relative w-full h-full">
            <img
              src={item.images[currentImageIndex] || '/placeholder.jpg'}
              alt={item.title}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setIsImageLoaded(true)}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            )}

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {item.images.slice(0, 5).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentImageIndex
                          ? 'w-5 bg-white'
                          : 'w-1.5 bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  ))}
                  {item.images.length > 5 && (
                    <span className="text-[10px] text-white/70 ml-1">+{item.images.length - 5}</span>
                  )}
                </div>
              </>
            )}

            {/* Type Badge */}
            <div className="absolute top-3 left-3 z-10">
              <div className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-sm ${getTypeColor()}`}>
                {getTypeLabel()}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-[var(--color-text-primary)] text-base line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {item.title}
          </h3>
          <span className="flex-shrink-0 text-[11px] text-[var(--color-text-tertiary)] px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)]">
            {formatTimeAgo(item.createdAt)}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
            {item.description}
          </p>
        )}

        {/* Pro Info Row */}
        <Link
          href={`/professionals/${item.pro._id}`}
          className="flex items-center gap-3 p-2.5 -mx-1 rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-colors group/pro"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[var(--color-border)] flex-shrink-0">
            {item.pro.avatar ? (
              <img src={item.pro.avatar} alt={item.pro.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-semibold"
                style={{
                  background: `linear-gradient(135deg, hsl(${(item.pro.name.charCodeAt(0) * 7) % 360}, 65%, 50%) 0%, hsl(${(item.pro.name.charCodeAt(0) * 7 + 40) % 360}, 55%, 40%) 100%)`,
                }}
              >
                {item.pro.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate group-hover/pro:text-emerald-600 dark:group-hover/pro:text-emerald-400 transition-colors">
              {item.pro.name}
            </h4>
            <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)]">
              {item.pro.rating > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{item.pro.rating.toFixed(1)}</span>
                </div>
              )}
              {item.pro.title && (
                <>
                  <span className="text-[var(--color-text-muted)]">•</span>
                  <span className="truncate">{item.pro.title}</span>
                </>
              )}
            </div>
          </div>
          <svg className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover/pro:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Bottom Stats Row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
          {/* Category Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)]">
            <svg className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {getCategoryLabel(item.category)}
            </span>
          </div>

          {/* Location if available */}
          {item.client?.city && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-tertiary)]">
              <svg className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">{item.client.city}</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Like Button - Only for authenticated users */}
          {isAuthenticated && (
            <LikeButton
              isLiked={item.isLiked}
              likeCount={item.likeCount}
              onToggle={onLike || (() => {})}
              variant="minimal"
              size="sm"
              showCount={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
