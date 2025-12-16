'use client';

import Link from 'next/link';
import { ProProfile, ProStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

interface ProCardProps {
  profile: ProProfile;
  variant?: 'default' | 'compact' | 'horizontal';
  onLike?: () => void;
  showLikeButton?: boolean;
}

export default function ProCard({ profile, variant = 'default', onLike, showLikeButton = true }: ProCardProps) {
  const { t, locale } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const proUser = typeof profile.userId === 'object' ? profile.userId : null;
  const status = profile.status || (profile.isAvailable ? ProStatus.ACTIVE : ProStatus.AWAY);

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

  const isTopRated = profile.avgRating >= 4.8 && profile.totalReviews >= 5;
  const isPremium = profile.isPremium || false;

  // Avatar priority
  const isProfileAvatarBroken = profile.avatar?.includes('/uploads/');
  const rawAvatarUrl = (!isProfileAvatarBroken && profile.avatar) || proUser?.avatar;
  const avatarUrl = rawAvatarUrl
    ? (rawAvatarUrl.startsWith('http') || rawAvatarUrl.startsWith('data:')
        ? rawAvatarUrl
        : `${process.env.NEXT_PUBLIC_API_URL}${rawAvatarUrl}`)
    : null;

  const displayName = proUser?.name || profile.title || 'Professional';
  const bioText = profile.bio || profile.description || '';
  const completedJobs = (profile.completedJobs || 0) + (profile.externalCompletedJobs || 0);

  // Status config
  const statusConfig = {
    [ProStatus.ACTIVE]: {
      label: locale === 'ka' ? 'თავისუფალი' : 'Available',
      color: 'bg-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.6)]'
    },
    [ProStatus.BUSY]: {
      label: locale === 'ka' ? 'დაკავებული' : 'Busy',
      color: 'bg-amber-400',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.6)]'
    },
    [ProStatus.AWAY]: {
      label: locale === 'ka' ? 'არ არის' : 'Away',
      color: 'bg-neutral-500',
      glow: ''
    },
  };

  const currentStatus = statusConfig[status] || statusConfig[ProStatus.AWAY];

  // Default/Compact variant - Cinematic card design
  if (variant === 'compact' || variant === 'default') {
    return (
      <Link
        href={`/professionals/${profile._id}`}
        className="group block relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Card Container */}
        <div className="relative overflow-hidden rounded-[20px] bg-[#0a0a0a] transition-all duration-500 ease-out group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">

          {/* Hero Image Section */}
          <div className="relative aspect-[4/5] overflow-hidden">
            {/* Background - Avatar or Gradient */}
            {avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={displayName}
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
              <div className="w-full h-full bg-gradient-to-br from-[#E07B4F]/30 via-[#E8956A]/20 to-neutral-900 flex items-center justify-center">
                <span className="text-6xl font-bold text-white/20">{displayName.charAt(0)}</span>
              </div>
            )}

            {/* Loading shimmer */}
            {!imageLoaded && !imageError && avatarUrl && (
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 animate-pulse" />
            )}

            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

            {/* Noise texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Top badges row */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
              {/* Premium badge */}
              {isPremium && (
                <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white">PRO</span>
                </div>
              )}

              {/* Top rated badge */}
              {isTopRated && !isPremium && (
                <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[10px] font-semibold text-white">Top Rated</span>
                  </div>
                </div>
              )}

              {/* Like button */}
              {showLikeButton && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLike?.();
                  }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${profile.isLiked
                      ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                      : 'bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 hover:text-white border border-white/10'
                    }
                    ${!isPremium && !isTopRated ? 'ml-auto' : ''}
                  `}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${profile.isLiked ? 'scale-110' : 'group-hover:scale-110'}`}
                    fill={profile.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Status indicator - floating */}
            <div className={`
              absolute top-4 left-1/2 -translate-x-1/2
              px-3 py-1 rounded-full
              bg-black/40 backdrop-blur-md border border-white/10
              flex items-center gap-2
              transition-all duration-300
              ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
            `}>
              <span className={`w-2 h-2 rounded-full ${currentStatus.color} ${currentStatus.glow}`} />
              <span className="text-[10px] font-medium text-white/90">{currentStatus.label}</span>
            </div>

            {/* Bottom Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              {/* Name and Title */}
              <div className="mb-3">
                <h3 className="text-white font-semibold text-lg leading-tight mb-1">
                  {displayName}
                </h3>
                <p className="text-white/50 text-sm">
                  {profile.title || getCategoryLabel(profile.categories[0])}
                </p>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-4">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-white font-semibold text-sm">
                    {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                  </span>
                  {profile.totalReviews > 0 && (
                    <span className="text-white/40 text-xs">({profile.totalReviews})</span>
                  )}
                </div>

                {/* Separator */}
                <span className="w-px h-4 bg-white/20" />

                {/* Experience */}
                <div className="flex items-center gap-1.5 text-white/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{profile.yearsExperience || 0} {locale === 'ka' ? 'წელი' : 'years'}</span>
                </div>

                {/* Completed jobs */}
                {completedJobs > 0 && (
                  <>
                    <span className="w-px h-4 bg-white/20" />
                    <div className="flex items-center gap-1.5 text-white/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">{completedJobs}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Category tags */}
              <div className="flex flex-wrap gap-2">
                {profile.categories.slice(0, 2).map((cat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full bg-white/10 text-white/70 backdrop-blur-sm"
                  >
                    {getCategoryLabel(cat)}
                  </span>
                ))}
              </div>
            </div>

            {/* Hover reveal arrow */}
            <div className={`
              absolute bottom-5 right-5 w-10 h-10 rounded-full
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

  // Horizontal variant - Cinematic list style
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/professionals/${profile._id}`}
        className="group block relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[16px] bg-[#0a0a0a] transition-all duration-500 ease-out group-hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 p-4">
            {/* Avatar section */}
            <div className="relative flex-shrink-0">
              <div className={`
                absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `} />
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-800">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E07B4F]/30 to-neutral-800">
                    <span className="text-2xl font-bold text-white/40">{displayName.charAt(0)}</span>
                  </div>
                )}
              </div>
              {/* Status indicator */}
              <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ${currentStatus.color} border-2 border-[#0a0a0a] ${currentStatus.glow}`} />
            </div>

            {/* Info section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base text-white truncate group-hover:text-[#E07B4F] transition-colors">
                  {displayName}
                </h3>
                {isPremium && (
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    PRO
                  </span>
                )}
                {isTopRated && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20">
                    <svg className="w-2.5 h-2.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[9px] font-semibold text-amber-400">Top</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-white/50 mb-2">
                {profile.title || getCategoryLabel(profile.categories[0])}
              </p>

              <div className="flex items-center gap-3 text-xs">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-semibold text-white">
                    {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                  </span>
                  {profile.totalReviews > 0 && <span className="text-white/40">({profile.totalReviews})</span>}
                </div>

                <span className="w-px h-3 bg-white/20" />

                {/* Experience */}
                <span className="text-white/50 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {profile.yearsExperience}+ {locale === 'ka' ? 'წელი' : 'years'}
                </span>

                {completedJobs > 0 && (
                  <>
                    <span className="w-px h-3 bg-white/20" />
                    <span className="text-white/50 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {completedJobs} {locale === 'ka' ? 'პროექტი' : 'jobs'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {showLikeButton && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLike?.();
                  }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${profile.isLiked
                      ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-red-400 border border-white/10'
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill={profile.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              )}

              {/* Arrow */}
              <div className={`
                w-10 h-10 rounded-full bg-white flex items-center justify-center
                transition-all duration-500 ease-out
                ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
              `}>
                <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom gradient accent */}
          <div className={`
            absolute bottom-0 left-0 right-0 h-[2px]
            bg-gradient-to-r from-[#E07B4F] via-[#E8956A] to-[#E07B4F]
            transition-transform duration-500 origin-left
            ${isHovered ? 'scale-x-100' : 'scale-x-0'}
          `} />
        </div>
      </Link>
    );
  }

  return null;
}
