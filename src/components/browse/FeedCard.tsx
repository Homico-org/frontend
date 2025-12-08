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
      className="group block"
    >
      <div className="relative rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
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
                  <svg className="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <>
              <img
                src={item.images[currentImageIndex] || '/placeholder.jpg'}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {hasMultipleImages && (
                <>
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3.5 h-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px]">
                    {currentImageIndex + 1} / {totalImages}
                  </div>
                </>
              )}
            </>
          )}

          {/* Like - top right */}
          {isAuthenticated && (
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
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
        </div>

        {/* Simple footer */}
        <div className="p-3 flex items-center gap-3">
          {/* Pro avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[var(--color-border)]">
            {item.pro.avatar ? (
              <img src={item.pro.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-xs font-medium"
                style={{
                  background: `linear-gradient(135deg, hsl(${(item.pro.name.charCodeAt(0) * 7) % 360}, 60%, 50%), hsl(${(item.pro.name.charCodeAt(0) * 7 + 40) % 360}, 50%, 40%))`,
                }}
              >
                {item.pro.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Title and Pro name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {item.title}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] truncate">
              {item.pro.name}
              {item.pro.rating > 0 && (
                <span className="inline-flex items-center ml-1.5">
                  <svg className="w-3 h-3 text-amber-500 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {item.pro.rating.toFixed(1)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
