'use client';

import { useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

export interface BeforeAfterSliderProps {
  /** Already-resolved URL for the "before" image */
  beforeImage: string;
  /** Already-resolved URL for the "after" image */
  afterImage: string;
  /** Aspect ratio class, e.g. "aspect-[4/3]", "aspect-square", "aspect-video". Default: "aspect-[4/3]" */
  aspectRatio?: string;
  /** Initial slider position in percent. Default: 50 */
  initialPosition?: number;
  /** Image sizes attr for next/image. Default: "(max-width: 640px) 100vw, 600px" */
  sizes?: string;
  /** Show before/after text labels. Default: true */
  showLabels?: boolean;
  /** Custom before label */
  beforeLabel?: string;
  /** Custom after label */
  afterLabel?: string;
  /** Handle size. Default: "md" */
  handleSize?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
  /** Priority loading for next/image */
  priority?: boolean;
}

const HANDLE_SIZES = { sm: 28, md: 40, lg: 52 };

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  aspectRatio = 'aspect-[4/3]',
  initialPosition = 50,
  sizes = '(max-width: 640px) 100vw, 600px',
  showLabels = true,
  beforeLabel,
  afterLabel,
  handleSize = 'md',
  className = '',
  priority = false,
}: BeforeAfterSliderProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const beforeSrc = beforeImage;
  const afterSrc = afterImage;

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    if (clipRef.current) clipRef.current.style.width = `${pct}%`;
    if (handleRef.current) handleRef.current.style.left = `${pct}%`;
  }, []);

  const onMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDraggingRef.current && e.type !== 'click') return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    },
    [updatePosition],
  );

  const px = HANDLE_SIZES[handleSize];

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${aspectRatio} cursor-ew-resize select-none bg-[var(--hm-bg-tertiary)] overflow-hidden touch-none ${className}`}
      onMouseDown={(e) => {
        e.preventDefault();
        isDraggingRef.current = true;
      }}
      onMouseUp={() => {
        isDraggingRef.current = false;
      }}
      onMouseLeave={() => {
        isDraggingRef.current = false;
      }}
      onMouseMove={onMove}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        updatePosition(e.clientX);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        isDraggingRef.current = true;
      }}
      onTouchEnd={() => {
        isDraggingRef.current = false;
      }}
      onTouchMove={onMove}
    >
      {/* After image (background) */}
      <Image
        src={afterSrc}
        alt="After"
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
      />

      {/* Before image (clipped) */}
      <div
        ref={clipRef}
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${initialPosition}%` }}
      >
        <Image
          src={beforeSrc}
          alt="Before"
          fill
          className="object-cover"
          sizes={sizes}
          priority={priority}
        />
      </div>

      {/* Divider line + handle */}
      <div
        ref={handleRef}
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${initialPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute inset-0 w-0.5 bg-[var(--hm-bg-elevated)] shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--hm-bg-elevated)] shadow-xl flex items-center justify-center border-2 border-[var(--hm-brand-500)]/20"
          style={{ width: px, height: px }}
        >
          <div className="flex items-center gap-0.5">
            <ChevronLeft className="w-3 h-3 text-[var(--hm-fg-muted)]" />
            <ChevronRight className="w-3 h-3 text-[var(--hm-fg-muted)]" />
          </div>
        </div>
      </div>

      {/* Labels */}
      {showLabels && (
        <>
          <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full">
            {beforeLabel || t('common.before')}
          </div>
          <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-[var(--hm-fg-primary)] text-[11px] font-semibold rounded-full shadow-lg">
            {afterLabel || t('common.after')}
          </div>
        </>
      )}
    </div>
  );
}
