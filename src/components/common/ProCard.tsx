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
                      variant="minimal"
                      size="sm"
                      showCount={false}
                    />
                  )}
                </div>

                {/* Top rated badge */}
                {isTopRated && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 mt-1 rounded-full bg-amber-100 dark:bg-amber-500/20 w-fit">
                    <svg className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">Top რეიტინგი</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Bar - Rating, Experience, Jobs from Homico, External Jobs */}
          <div
            className="grid grid-cols-4 gap-0.5 px-1.5 sm:px-2 py-2 border-t"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)'
            }}
          >
            {/* Rating */}
            <div className="flex flex-col items-center text-center px-1">
              <div className="flex items-center gap-0.5 mb-0.5">
                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                </span>
              </div>
              <span className="text-[8px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                {profile.totalReviews > 0 ? `${profile.totalReviews} შეფ.` : 'რეიტინგი'}
              </span>
            </div>

            {/* Experience */}
            <div className="flex flex-col items-center text-center px-1 border-l" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-0.5 mb-0.5">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.yearsExperience || 0}+
                </span>
              </div>
              <span className="text-[8px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                წელი გამოცდ.
              </span>
            </div>

            {/* Completed Jobs from Homico */}
            <div className="flex flex-col items-center text-center px-1 border-l" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-0.5 mb-0.5">
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.completedJobs || 0}
                </span>
              </div>
              <span className="text-[8px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                Homico-ზე
              </span>
            </div>

            {/* External Completed Jobs */}
            <div className="flex flex-col items-center text-center px-1 border-l" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-0.5 mb-0.5">
                <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.externalCompletedJobs || 0}
                </span>
              </div>
              <span className="text-[8px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                გარეთ
              </span>
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
            /* Empty portfolio placeholder */
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div
                className="flex items-center justify-center gap-2 py-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-[var(--color-text-muted)]">პორტფოლიო მალე</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Compact variant - Smaller card for tight spaces (grid view)
  if (variant === 'compact') {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block">
        <div
          className="relative rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Image section */}
          <div className="relative aspect-[4/3] overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Status badge - minimal */}
            <div className="absolute top-2 right-2 z-10">
              <StatusBadge status={status} variant="minimal" />
            </div>

            {/* Name overlay on image */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <h3 className="font-semibold text-sm text-white truncate">
                {displayName}
              </h3>
              <p className="text-[11px] text-white/70 truncate">
                {profile.title || getCategoryLabel(profile.categories[0])}
              </p>
            </div>
          </div>

          {/* Stats Bar - 4 columns */}
          <div
            className="grid grid-cols-4 gap-0 py-2 px-1"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            {/* Rating */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                </span>
              </div>
              <span className="text-[7px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                რეიტინგი
              </span>
            </div>

            {/* Experience */}
            <div className="flex flex-col items-center text-center border-l" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.yearsExperience || 0}+
                </span>
              </div>
              <span className="text-[7px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                წელი
              </span>
            </div>

            {/* Homico Jobs */}
            <div className="flex flex-col items-center text-center border-l" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.completedJobs || 0}
                </span>
              </div>
              <span className="text-[7px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                Homico
              </span>
            </div>

            {/* External Jobs */}
            <div className="flex flex-col items-center text-center border-l" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.externalCompletedJobs || 0}
                </span>
              </div>
              <span className="text-[7px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                გარეთ
              </span>
            </div>
          </div>

          {/* Portfolio Preview - Last 3 jobs */}
          {hasPortfolio ? (
            <div className="flex gap-1 p-1.5 overflow-x-auto scrollbar-none" style={{ scrollSnapType: 'x mandatory' }}>
              {portfolioImages.slice(0, 3).map((img, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-[calc(33.333%-3px)] aspect-square rounded-md overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <img
                    src={img}
                    alt={`სამუშაო ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-1.5">
              <div
                className="flex items-center justify-center gap-1.5 py-2 rounded-md"
                style={{ backgroundColor: 'var(--color-bg-primary)' }}
              >
                <svg className="w-3 h-3 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[9px] text-[var(--color-text-muted)]">პორტფოლიო მალე</span>
              </div>
            </div>
          )}
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
            <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
              {profile.totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{profile.avgRating.toFixed(1)}</span>
                  <span>({profile.totalReviews})</span>
                </div>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {profile.yearsExperience}+ წელი
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {profile.completedJobs || 0} Homico
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {profile.externalCompletedJobs || 0} გარეთ
              </span>
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
