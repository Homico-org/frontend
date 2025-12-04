'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeedItem, FeedItemType } from '@/types';
import LikeButton from '@/components/common/LikeButton';

interface FeedCardProps {
  item: FeedItem;
  onLike?: () => void;
}

export default function FeedCard({ item, onLike }: FeedCardProps) {
  const { t, locale } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const hasMultipleImages = item.images.length > 1;
  const isBeforeAfter = item.type === FeedItemType.BEFORE_AFTER && item.beforeImage && item.afterImage;

  const getCategoryLabel = (category: string) => {
    const translated = t(`categories.${category}`);
    if (translated === `categories.${category}`) {
      return category
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return translated;
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case FeedItemType.PORTFOLIO:
        return locale === 'ka' ? 'პორტფოლიო' : 'Portfolio';
      case FeedItemType.COMPLETION:
        return locale === 'ka' ? 'დასრულებული' : 'Completed';
      case FeedItemType.BEFORE_AFTER:
        return locale === 'ka' ? 'მანამდე/მერე' : 'Before/After';
      case FeedItemType.PRO_HIGHLIGHT:
        return locale === 'ka' ? 'რეკომენდებული' : 'Featured';
      default:
        return '';
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging && e.type !== 'click') return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return locale === 'ka' ? 'დღეს' : 'Today';
    if (diffDays === 1) return locale === 'ka' ? 'გუშინ' : 'Yesterday';
    if (diffDays < 7) return locale === 'ka' ? `${diffDays} დღის წინ` : `${diffDays}d ago`;
    if (diffDays < 30) return locale === 'ka' ? `${Math.floor(diffDays / 7)} კვირის წინ` : `${Math.floor(diffDays / 7)}w ago`;
    return locale === 'ka' ? `${Math.floor(diffDays / 30)} თვის წინ` : `${Math.floor(diffDays / 30)}mo ago`;
  };

  return (
    <div className="group relative bg-[var(--color-bg-primary)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-all duration-300 hover:shadow-xl">
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
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
              {/* Slider Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
              {locale === 'ka' ? 'მანამდე' : 'Before'}
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
              {locale === 'ka' ? 'შემდეგ' : 'After'}
            </div>
          </div>
        ) : (
          /* Regular Image Display */
          <>
            <img
              src={item.images[currentImageIndex] || '/placeholder.jpg'}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Image Navigation Dots */}
            {hasMultipleImages && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {item.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                    className={`
                      w-1.5 h-1.5 rounded-full transition-all duration-200
                      ${idx === currentImageIndex
                        ? 'bg-white w-4'
                        : 'bg-white/50 hover:bg-white/75'
                      }
                    `}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-xs font-semibold text-[var(--color-text-primary)]">
            {getTypeLabel()}
          </span>
        </div>

        {/* Like Button */}
        <div className="absolute top-3 right-3">
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
          className="absolute bottom-3 left-3 right-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30 flex-shrink-0">
            {item.pro.avatar ? (
              <img
                src={item.pro.avatar}
                alt={item.pro.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-semibold"
                style={{
                  background: `linear-gradient(135deg, hsl(${(item.pro.name.charCodeAt(0) * 7) % 360}, 70%, 45%) 0%, hsl(${(item.pro.name.charCodeAt(0) * 7 + 40) % 360}, 60%, 35%) 100%)`,
                }}
              >
                {item.pro.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {item.pro.name}
            </h4>
            {item.pro.rating > 0 && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-white/90 font-medium">
                  {item.pro.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
            {item.title}
          </h3>
          <span className="text-xs text-[var(--color-text-tertiary)] whitespace-nowrap">
            {formatTimeAgo(item.createdAt)}
          </span>
        </div>

        {item.description && (
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        {/* Client Review */}
        {item.review && item.rating && (
          <div className="p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              {item.client?.avatar ? (
                <img
                  src={item.client.avatar}
                  alt={item.client.name || ''}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {item.client?.name || (locale === 'ka' ? 'კლიენტი' : 'Client')}
              </span>
              <div className="flex items-center gap-0.5 ml-auto">
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
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 italic">
              "{item.review}"
            </p>
          </div>
        )}

        {/* Category Tag */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-bg-tertiary)] text-xs font-medium text-[var(--color-text-secondary)]">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {getCategoryLabel(item.category)}
          </span>

          <Link
            href={`/professionals/${item.pro._id}`}
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            {locale === 'ka' ? 'პროფილის ნახვა' : 'View Profile'}
          </Link>
        </div>
      </div>
    </div>
  );
}
