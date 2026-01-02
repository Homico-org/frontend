'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

export interface MediaItem {
  url: string;
  title?: string;
  description?: string;
  type?: 'image' | 'video';
}

export interface MediaLightboxProps {
  /** Array of media items */
  items: MediaItem[];
  /** Current index */
  currentIndex: number;
  /** Whether the lightbox is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Index change callback */
  onIndexChange?: (index: number) => void;
  /** Show thumbnails strip */
  showThumbnails?: boolean;
  /** Show counter (e.g., "1 / 5") */
  showCounter?: boolean;
  /** Show title/description */
  showInfo?: boolean;
  /** Custom image URL transformer */
  getImageUrl?: (url: string) => string;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom class for the container */
  className?: string;
}

export default function MediaLightbox({
  items,
  currentIndex: externalIndex,
  isOpen,
  onClose,
  onIndexChange,
  showThumbnails = true,
  showCounter = true,
  showInfo = true,
  getImageUrl = (url) => url,
  locale = 'en',
  className = '',
}: MediaLightboxProps) {
  const [internalIndex, setInternalIndex] = useState(externalIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync internal index with external
  useEffect(() => {
    setInternalIndex(externalIndex);
  }, [externalIndex]);

  const currentIndex = internalIndex;
  const currentItem = items[currentIndex];

  const goToNext = useCallback(() => {
    const newIndex = (currentIndex + 1) % items.length;
    setInternalIndex(newIndex);
    onIndexChange?.(newIndex);
    setIsZoomed(false);
  }, [currentIndex, items.length, onIndexChange]);

  const goToPrev = useCallback(() => {
    const newIndex = (currentIndex - 1 + items.length) % items.length;
    setInternalIndex(newIndex);
    onIndexChange?.(newIndex);
    setIsZoomed(false);
  }, [currentIndex, items.length, onIndexChange]);

  const goToIndex = useCallback((index: number) => {
    setInternalIndex(index);
    onIndexChange?.(index);
    setIsZoomed(false);
  }, [onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentItem) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black/95 flex flex-col ${className}`}
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {showInfo && currentItem.title ? (
          <h3 className="text-white font-semibold text-lg truncate max-w-[70%]">
            {currentItem.title}
          </h3>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {/* Zoom button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? (
              <ZoomOut className="w-5 h-5" />
            ) : (
              <ZoomIn className="w-5 h-5" />
            )}
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label={locale === 'ka' ? 'დახურვა' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex items-center justify-center relative px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label={locale === 'ka' ? 'წინა' : 'Previous'}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
              aria-label={locale === 'ka' ? 'შემდეგი' : 'Next'}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image */}
        {currentItem.type === 'video' ? (
          <video
            src={getImageUrl(currentItem.url)}
            controls
            className={`max-w-full max-h-[70vh] object-contain rounded-lg transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        ) : (
          <img
            src={getImageUrl(currentItem.url)}
            alt={currentItem.title || ''}
            className={`max-w-full max-h-[70vh] object-contain rounded-lg transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        )}
      </div>

      {/* Description */}
      {showInfo && currentItem.description && (
        <div className="px-4 pb-2 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-white/70 text-sm max-w-2xl mx-auto">
            {currentItem.description}
          </p>
        </div>
      )}

      {/* Thumbnails & Counter */}
      {(showThumbnails || showCounter) && items.length > 1 && (
        <div className="p-4" onClick={(e) => e.stopPropagation()}>
          {showThumbnails && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => goToIndex(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                    idx === currentIndex
                      ? 'ring-2 ring-[#C4735B] ring-offset-2 ring-offset-black'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getImageUrl(item.url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          {showCounter && (
            <div className="text-center mt-2">
              <span className="text-white/60 text-sm">
                {currentIndex + 1} / {items.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified hook for lightbox state management
export function useLightbox(items: MediaItem[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((index: number = 0) => {
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    currentIndex,
    open,
    close,
    setCurrentIndex,
    lightboxProps: {
      items,
      currentIndex,
      isOpen,
      onClose: close,
      onIndexChange: setCurrentIndex,
    },
  };
}
