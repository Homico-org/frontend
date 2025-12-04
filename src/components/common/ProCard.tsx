'use client';

import Link from 'next/link';
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

  // Default card variant - Modern image-based design matching reference
  if (variant === 'default') {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block touch-manipulation">
        <div
          className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
          style={{
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Status badge */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
            <StatusBadge status={status} size="sm" />
          </div>

          {/* Like button */}
          {showLikeButton && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
              {isTopRated ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-amber-400/90 backdrop-blur-sm shadow-lg">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-900 uppercase tracking-wide">Top</span>
                  </div>
                  <LikeButton
                    isLiked={profile.isLiked || false}
                    likeCount={profile.likeCount || 0}
                    onToggle={onLike || (() => {})}
                    variant="overlay"
                    size="sm"
                    showCount={false}
                  />
                </div>
              ) : (
                <LikeButton
                  isLiked={profile.isLiked || false}
                  likeCount={profile.likeCount || 0}
                  onToggle={onLike || (() => {})}
                  variant="overlay"
                  size="sm"
                />
              )}
            </div>
          )}

          {/* Top rated badge (when no like button) */}
          {!showLikeButton && isTopRated && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
              <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-amber-400/90 backdrop-blur-sm shadow-lg">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-900 uppercase tracking-wide">Top</span>
              </div>
            </div>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
            <div className="flex items-end justify-between gap-2 sm:gap-3">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-white mb-0.5 truncate group-hover:text-emerald-400 transition-colors">
                  {displayName}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 truncate">
                  {profile.title || getCategoryLabel(profile.categories[0])}
                </p>
                {/* Rating */}
                {profile.totalReviews > 0 && (
                  <div className="flex items-center gap-1 sm:gap-1.5 mt-1 sm:mt-2">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-white">{profile.avgRating.toFixed(1)}</span>
                    <span className="text-[10px] sm:text-xs text-white/50">({profile.totalReviews})</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/professionals/${profile._id}`;
                }}
                className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 touch-manipulation"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
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
