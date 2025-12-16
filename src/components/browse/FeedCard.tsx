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
  const [isHovered, setIsHovered] = useState(false);

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
      className="group block relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card Container */}
      <div className="relative overflow-hidden rounded-[20px] bg-[#0a0a0a] transition-all duration-500 ease-out group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">

        {/* Image Section */}
        <div className="relative aspect-[3/4] overflow-hidden">
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
                <div className="absolute inset-0 w-[2px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* Before/After labels */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-[0.2em]">
                Before
              </div>
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em]">
                After
              </div>
            </div>
          ) : (
            <>
              {/* Main Image with Ken Burns effect */}
              {!imageError ? (
                <img
                  src={item.images[currentImageIndex]}
                  alt={item.title}
                  className={`
                    w-full h-full object-cover
                    transition-all duration-[1.2s] ease-out
                    group-hover:scale-110
                    ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  `}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                  <svg className="w-16 h-16 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              )}

              {/* Loading shimmer */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 animate-pulse" />
              )}

              {/* Cinematic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />

              {/* Noise texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Image navigation for multiple images */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                      bg-black/50 backdrop-blur-md
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-all duration-300 hover:bg-black/70
                      border border-white/10
                      z-20"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                      bg-black/50 backdrop-blur-md
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-all duration-300 hover:bg-black/70
                      border border-white/10
                      z-20"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image dots indicator */}
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {item.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentImageIndex
                            ? 'bg-white w-4'
                            : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Top left badges - Verified/External indicator */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
            {item.isVerified ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 shadow-lg">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white">Homico</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="text-[9px] font-medium text-white/70">Portfolio</span>
              </div>
            )}
          </div>

          {/* Like button - floating top right */}
          {isAuthenticated && !isBeforeAfter && (
            <div className="absolute top-4 right-4 z-20" onClick={(e) => e.preventDefault()}>
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

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            {/* Pro Info Bar */}
            <div className="flex items-center gap-3">
              {/* Avatar with animated border */}
              <div className="relative">
                <div className={`
                  absolute -inset-[2px] rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500
                  transition-opacity duration-300
                  ${isHovered ? 'opacity-100' : 'opacity-0'}
                `} />
                <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 bg-neutral-800">
                  {item.pro.avatar ? (
                    <img src={item.pro.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-amber-500 to-orange-600">
                      {item.pro.name.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a0a0a]" />
              </div>

              {/* Name and Title */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm truncate leading-tight">
                  {item.pro.name}
                </h3>
                <p className="text-white/60 text-xs truncate mt-0.5">
                  {item.title}
                </p>
              </div>

              {/* Rating badge */}
              {item.pro.rating > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                  <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-white text-[11px] font-semibold">
                    {item.pro.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hover reveal arrow */}
          <div className={`
            absolute bottom-4 right-4 w-10 h-10 rounded-full
            bg-white flex items-center justify-center
            transition-all duration-500 ease-out z-20
            ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
          `}>
            <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
