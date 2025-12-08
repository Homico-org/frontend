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

  const isTopRated = profile.avgRating >= 4.8 && profile.totalReviews >= 5;
  const avatarUrl = profile.avatar || proUser?.avatar;
  const displayName = proUser?.name || 'Professional';
  const bioText = profile.bio || profile.description || '';

  // Default card variant - Hero image with gradient blur and overlaid stats
  if (variant === 'default') {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block touch-manipulation">
        <div
          className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Hero Image Section with Gradient Blur */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  background: `linear-gradient(135deg,
                    hsl(${(displayName.charCodeAt(0) * 7) % 360}, 65%, 45%) 0%,
                    hsl(${(displayName.charCodeAt(0) * 7 + 40) % 360}, 55%, 35%) 100%)`
                }}
              />
            )}

            {/* Beautiful gradient blur from bottom */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                backdropFilter: 'blur(0px)',
              }}
            />

            {/* Blur overlay at the very bottom for extra softness */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/3"
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
              }}
            />

            {/* Status badge - top right */}
            <div className="absolute top-3 right-3 z-10">
              <StatusBadge status={status} variant="minimal" />
            </div>

            {/* Like button - top left */}
            {showLikeButton && (
              <div className="absolute top-3 left-3 z-10">
                <LikeButton
                  isLiked={profile.isLiked || false}
                  likeCount={profile.likeCount || 0}
                  onToggle={onLike || (() => {})}
                  variant="minimal"
                  size="sm"
                  showCount={false}
                />
              </div>
            )}

            {/* Stats overlay on image - bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              {/* Stats row */}
              <div className="flex items-center gap-4 mb-3">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">
                    {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                  </span>
                  {profile.totalReviews > 0 && (
                    <span className="text-xs text-white/60">({profile.totalReviews})</span>
                  )}
                </div>

                {/* Experience */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-white">
                    {profile.yearsExperience || 0}+ წელი
                  </span>
                </div>

                {/* Top rated badge */}
                {isTopRated && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-sm">
                    <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">Top</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="font-bold text-lg text-white truncate leading-tight mb-1 group-hover:text-emerald-300 transition-colors">
                {displayName}
              </h3>

              {/* Category - Larger and more prominent */}
              <p className="text-sm font-medium text-white/80 truncate">
                {profile.title || getCategoryLabel(profile.categories[0])}
              </p>
            </div>
          </div>

          {/* Content Section - Categories and Bio */}
          <div className="p-4">
            {/* Categories - Larger pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {profile.categories.slice(0, 3).map((cat, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {getCategoryLabel(cat)}
                </span>
              ))}
              {profile.categories.length > 3 && (
                <span className="px-2 py-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  +{profile.categories.length - 3}
                </span>
              )}
            </div>

            {/* Bio/Description */}
            {bioText && (
              <p
                className="text-sm leading-relaxed line-clamp-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {bioText}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Compact variant - Clean grid card with hero image
  if (variant === 'compact') {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block h-full">
        <div
          className="relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Hero Image with gradient blur */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  background: `linear-gradient(135deg,
                    hsl(${(displayName.charCodeAt(0) * 7) % 360}, 65%, 45%) 0%,
                    hsl(${(displayName.charCodeAt(0) * 7 + 40) % 360}, 55%, 35%) 100%)`
                }}
              />
            )}

            {/* Gradient blur overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)',
              }}
            />

            {/* Status badge */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <StatusBadge status={status} variant="minimal" size="sm" />
            </div>

            {/* Stats and name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
              {/* Stats row */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-semibold text-white">
                    {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-white/80">{profile.yearsExperience || 0}+ წ</span>
                </div>
              </div>

              <h3 className="font-semibold text-[15px] text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                {displayName}
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-3">
            {/* Category - Prominent */}
            <p
              className="text-sm font-medium truncate mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {profile.title || getCategoryLabel(profile.categories[0])}
            </p>

            {/* Bio - 1 line */}
            {bioText && (
              <p
                className="text-xs line-clamp-1"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {bioText}
              </p>
            )}
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
          className="relative flex gap-4 p-4 rounded-xl transition-all duration-200 hover:shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          {/* Avatar with gradient blur effect */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-xl overflow-hidden">
              {avatarUrl ? (
                <>
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle gradient on avatar */}
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)',
                    }}
                  />
                </>
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg,
                      hsl(${(displayName.charCodeAt(0) * 7) % 360}, 70%, 40%) 0%,
                      hsl(${(displayName.charCodeAt(0) * 7 + 40) % 360}, 60%, 30%) 100%)`
                  }}
                >
                  <span className="text-2xl font-bold text-white">{displayName.charAt(0)}</span>
                </div>
              )}
            </div>
            {/* Status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusBadge status={status} variant="minimal" size="sm" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className="font-semibold text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {displayName}
              </h3>
              {isTopRated && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-400/20 rounded-full flex-shrink-0">
                  <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">TOP</span>
                </div>
              )}
            </div>

            {/* Category - Larger */}
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {profile.title || getCategoryLabel(profile.categories[0])}
            </p>

            {/* Stats row - simplified */}
            <div className="flex items-center gap-3 text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                </span>
                {profile.totalReviews > 0 && <span>({profile.totalReviews})</span>}
              </div>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {profile.yearsExperience}+ წელი
              </span>
            </div>

            {/* Bio */}
            {bioText && (
              <p
                className="text-xs line-clamp-1"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {bioText}
              </p>
            )}

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.categories.slice(0, 2).map((cat, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs font-medium rounded-md"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {getCategoryLabel(cat)}
                </span>
              ))}
              {profile.categories.length > 2 && (
                <span className="px-1.5 py-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
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
