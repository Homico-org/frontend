import { useState, useCallback, useMemo } from 'react';

export interface UseImageCarouselOptions {
  /** Initial image index */
  initialIndex?: number;
  /** Whether to loop when reaching the end */
  loop?: boolean;
  /** Maximum number of images to handle */
  maxImages?: number;
}

export interface UseImageCarouselReturn {
  /** Current image index */
  currentIndex: number;
  /** Set current index directly */
  setCurrentIndex: (index: number) => void;
  /** Go to previous image */
  prevImage: (e?: React.MouseEvent) => void;
  /** Go to next image */
  nextImage: (e?: React.MouseEvent) => void;
  /** Go to specific image */
  goToImage: (index: number) => void;
  /** Whether there are multiple images */
  hasMultipleImages: boolean;
  /** Total number of images */
  totalImages: number;
  /** Whether currently at first image */
  isFirst: boolean;
  /** Whether currently at last image */
  isLast: boolean;
  /** Reset to first image */
  reset: () => void;
}

/**
 * Custom hook for managing image carousel state and navigation.
 * Handles prev/next navigation, dot indicators, and loop behavior.
 *
 * @example
 * ```tsx
 * const images = ['/img1.jpg', '/img2.jpg', '/img3.jpg'];
 * const {
 *   currentIndex,
 *   prevImage,
 *   nextImage,
 *   hasMultipleImages,
 * } = useImageCarousel(images.length);
 *
 * return (
 *   <div className="relative">
 *     <img src={images[currentIndex]} />
 *     {hasMultipleImages && (
 *       <>
 *         <button onClick={prevImage}>Prev</button>
 *         <button onClick={nextImage}>Next</button>
 *       </>
 *     )}
 *   </div>
 * );
 * ```
 */
export function useImageCarousel(
  imageCount: number,
  options: UseImageCarouselOptions = {}
): UseImageCarouselReturn {
  const { initialIndex = 0, loop = true, maxImages } = options;

  // Limit image count if maxImages is specified
  const effectiveCount = maxImages ? Math.min(imageCount, maxImages) : imageCount;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const hasMultipleImages = effectiveCount > 1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === effectiveCount - 1;

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!hasMultipleImages) return;

      setCurrentIndex((prev) => {
        if (prev === 0) {
          return loop ? effectiveCount - 1 : 0;
        }
        return prev - 1;
      });
    },
    [hasMultipleImages, effectiveCount, loop]
  );

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (!hasMultipleImages) return;

      setCurrentIndex((prev) => {
        if (prev === effectiveCount - 1) {
          return loop ? 0 : effectiveCount - 1;
        }
        return prev + 1;
      });
    },
    [hasMultipleImages, effectiveCount, loop]
  );

  const goToImage = useCallback(
    (index: number) => {
      if (index >= 0 && index < effectiveCount) {
        setCurrentIndex(index);
      }
    },
    [effectiveCount]
  );

  const reset = useCallback(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  return {
    currentIndex,
    setCurrentIndex,
    prevImage,
    nextImage,
    goToImage,
    hasMultipleImages,
    totalImages: effectiveCount,
    isFirst,
    isLast,
    reset,
  };
}

/**
 * Props for the carousel navigation button component
 */
export interface CarouselNavButtonProps {
  direction: 'prev' | 'next';
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Props for the carousel dot indicators component
 */
export interface CarouselDotsProps {
  total: number;
  current: number;
  maxDots?: number;
  onDotClick?: (index: number) => void;
  className?: string;
  dotClassName?: string;
  activeDotClassName?: string;
}

/**
 * Helper to generate dot indicator classes
 */
export function getCarouselDotClasses(
  index: number,
  currentIndex: number,
  baseClass = 'w-1.5 h-1.5 rounded-full transition-colors',
  activeClass = 'bg-white',
  inactiveClass = 'bg-white/50'
): string {
  return `${baseClass} ${index === currentIndex ? activeClass : inactiveClass}`;
}

export default useImageCarousel;
