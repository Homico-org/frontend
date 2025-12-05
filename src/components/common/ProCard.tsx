'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ProProfile, ProStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import StatusBadge from './StatusBadge';
import LikeButton from './LikeButton';

interface ProCardProps {
  profile: ProProfile;
  variant?: 'default' | 'compact' | 'horizontal';
  onLike?: () => void;
  showLikeButton?: boolean;
}

export default function ProCard({ profile, variant = 'default', onLike, showLikeButton = true }: ProCardProps) {
  const { t } = useLanguage();
  const proUser = typeof profile.userId === 'object' ? profile.userId : null;
  const status = profile.status || (profile.isAvailable ? ProStatus.ACTIVE : ProStatus.AWAY);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Collect all portfolio images
  const portfolioImages = profile.portfolioProjects?.flatMap(p => p.images) || [];
  const hasPortfolio = portfolioImages.length > 0;

  const getCategoryLabel = (category: string) => {
    const translated = t(`categories.${category}`);
    if (translated === `categories.${category}`) {
      return category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return translated;
  };

  const primaryCompany = profile.companies && profile.companies.length > 0 ? profile.companies[0] : null;
  const isTopRated = profile.avgRating >= 4.8 && profile.totalReviews >= 5;
  const avatarUrl = profile.avatar || proUser?.avatar;
  const displayName = proUser?.name || 'Professional';

  // Handle slider navigation
  const scrollToSlide = (index: number) => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.offsetWidth / 3; // Show 3 images at a time
      sliderRef.current.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth'
      });
      setCurrentSlide(index);
    }
  };

  // Handle scroll detection for active dot
  const handleScroll = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.offsetWidth / 3;
      const newSlide = Math.round(sliderRef.current.scrollLeft / slideWidth);
      setCurrentSlide(newSlide);
    }
  };

  // Default card variant - Compact modern design with portfolio slider
  if (variant === 'default') {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block touch-manipulation">
        <div
          className="relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Top Section - Avatar and Info */}
          <div className="relative p-3 sm:p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden ring-2 ring-[var(--color-border)]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg,
                          hsl(${(displayName.charCodeAt(0) * 7) % 360}, 70%, 40%) 0%,
                          hsl(${(displayName.charCodeAt(0) * 7 + 40) % 360}, 60%, 30%) 100%)`
                      }}
                    >
                      <span className="text-lg font-bold text-white">{displayName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                {/* Status badge on avatar */}
                <div className="absolute -bottom-1 -right-1">
                  <StatusBadge status={status} variant="minimal" size="sm" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className="font-semibold text-sm sm:text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {displayName}
                    </h3>
                    <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {profile.title || getCategoryLabel(profile.categories[0])}
                    </p>
                  </div>

                  {/* Like button */}
                  {showLikeButton && (
                    <LikeButton
                      isLiked={profile.isLiked || false}
                      likeCount={profile.likeCount || 0}
                      onToggle={onLike || (() => {})}
                      variant="ghost"
                      size="sm"
                      showCount={false}
                    />
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-2 mt-1.5">
                  {/* Rating */}
                  {profile.totalReviews > 0 && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {profile.avgRating.toFixed(1)}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        ({profile.totalReviews})
                      </span>
                    </div>
                  )}

                  {/* Top rated badge */}
                  {isTopRated && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20">
                      <svg className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">Top</span>
                    </div>
                  )}

                  {/* Separator */}
                  {profile.totalReviews > 0 && (
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>·</span>
                  )}

                  {/* Experience */}
                  <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {profile.yearsExperience}+ წ.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Image Slider */}
          {hasPortfolio ? (
            <div className="relative">
              {/* Slider container */}
              <div
                ref={sliderRef}
                onScroll={handleScroll}
                className="flex gap-1 px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto scrollbar-none scroll-smooth"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {portfolioImages.slice(0, 6).map((img, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-[calc(33.333%-4px)] aspect-square rounded-lg overflow-hidden"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <img
                      src={img}
                      alt={`Portfolio ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
                {/* Show more indicator */}
                {portfolioImages.length > 6 && (
                  <div
                    className="flex-shrink-0 w-[calc(33.333%-4px)] aspect-square rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    <div className="text-center">
                      <span className="text-lg font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                        +{portfolioImages.length - 6}
                      </span>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>სხვა</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scroll indicators (dots) - only show if more than 3 images */}
              {portfolioImages.length > 3 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                  {Array.from({ length: Math.min(Math.ceil(portfolioImages.length / 3), 3) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        scrollToSlide(idx * 3);
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        Math.floor(currentSlide / 3) === idx
                          ? 'bg-emerald-500 w-3'
                          : 'bg-[var(--color-text-muted)]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Fallback when no portfolio - show a subtle placeholder */
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div
                className="h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">პორტფოლიო მალე</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Compact variant - Smaller card for tight spaces
  if (variant === 'compact') {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block">
        <div
          className="relative aspect-square rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl"
          style={{
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Background image */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                background: `linear-gradient(135deg,
                  hsl(${(displayName.charCodeAt(0) * 7) % 360}, 70%, 40%) 0%,
                  hsl(${(displayName.charCodeAt(0) * 7 + 40) % 360}, 60%, 30%) 100%)`
              }}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Status badge - minimal */}
          <div className="absolute top-2 right-2 z-10">
            <StatusBadge status={status} variant="minimal" />
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-medium text-sm text-white truncate">
              {displayName}
            </h3>
            <p className="text-xs text-white/60 truncate">
              {profile.title || getCategoryLabel(profile.categories[0])}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal variant - For list views
  if (variant === 'horizontal') {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block">
        <div
          className="relative flex gap-4 p-4 rounded-xl transition-all duration-200"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-[var(--color-border)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg,
                      hsl(${(displayName.charCodeAt(0) * 7) % 360}, 70%, 40%) 0%,
                      hsl(${(displayName.charCodeAt(0) * 7 + 40) % 360}, 60%, 30%) 100%)`
                  }}
                >
                  <span className="text-xl font-bold text-white">{displayName.charAt(0)}</span>
                </div>
              )}
            </div>
            {/* Status indicator on avatar */}
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusBadge status={status} variant="minimal" size="sm" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className="font-semibold text-base truncate group-hover:text-emerald-500 transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {displayName}
              </h3>
              {isTopRated && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-400/20 rounded-full">
                  <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">TOP</span>
                </div>
              )}
            </div>
            <p className="text-sm truncate mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {profile.title || getCategoryLabel(profile.categories[0])}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {profile.totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{profile.avgRating.toFixed(1)}</span>
                  <span>({profile.totalReviews})</span>
                </div>
              )}
              <span>{profile.yearsExperience}+ წელი</span>
              <span>{profile.completedJobs || 0} პროექტი</span>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.categories.slice(0, 2).map((cat, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[11px] rounded-md font-medium"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {getCategoryLabel(cat)}
                </span>
              ))}
              {profile.categories.length > 2 && (
                <span className="px-1.5 py-0.5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  +{profile.categories.length - 2}
                </span>
              )}
            </div>
          </div>

          {/* Portfolio Preview - Small thumbnails */}
          {hasPortfolio && (
            <div className="hidden sm:flex flex-shrink-0 gap-1">
              {portfolioImages.slice(0, 2).map((img, idx) => (
                <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Arrow */}
          <div className="flex-shrink-0 self-center">
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: 'var(--color-text-tertiary)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    );
  }

  return null;
}
