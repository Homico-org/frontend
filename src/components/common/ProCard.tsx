'use client';

import Link from 'next/link';
import { ProProfile, ProStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Heart, Star, Clock, MapPin, CheckCircle2, Briefcase } from 'lucide-react';

interface ProCardProps {
  profile: ProProfile;
  variant?: 'default' | 'compact' | 'horizontal';
  onLike?: () => void;
  showLikeButton?: boolean;
}

export default function ProCard({ profile, variant = 'default', onLike, showLikeButton = true }: ProCardProps) {
  const { t, locale } = useLanguage();
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
  const premiumTier = profile.premiumTier || 'none';

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
      color: 'bg-emerald-500',
      ring: 'ring-emerald-500/20'
    },
    [ProStatus.BUSY]: {
      label: locale === 'ka' ? 'დაკავებული' : 'Busy',
      color: 'bg-amber-500',
      ring: 'ring-amber-500/20'
    },
    [ProStatus.AWAY]: {
      label: locale === 'ka' ? 'არ არის' : 'Away',
      color: 'bg-gray-400',
      ring: 'ring-gray-400/20'
    },
  };

  const currentStatus = statusConfig[status] || statusConfig[ProStatus.AWAY];

  // Compact card - the new default for browse grid
  if (variant === 'compact' || variant === 'default') {
    return (
      <Link
        href={`/professionals/${profile._id}`}
        className="pro-card-modern group"
      >
        {/* Top Section - Avatar and Quick Info */}
        <div className="flex gap-3 p-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-[var(--color-border-subtle)] group-hover:ring-[#D2691E]/30 transition-all duration-300">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#D2691E]/20 to-[#CD853F]/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#D2691E]">{displayName.charAt(0)}</span>
                </div>
              )}
            </div>
            {/* Status dot */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${currentStatus.color} ring-2 ring-[var(--color-bg-elevated)]`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-[15px] text-[var(--color-text-primary)] truncate group-hover:text-[#D2691E] transition-colors">
                {displayName}
              </h3>
              {isPremium && (
                <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  PRO
                </span>
              )}
            </div>

            {/* Category */}
            <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate mb-1.5">
              {profile.title || getCategoryLabel(profile.categories[0])}
            </p>

            {/* Quick stats row */}
            <div className="flex items-center gap-2.5 text-[11px]">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
                </span>
                {profile.totalReviews > 0 && (
                  <span className="text-[var(--color-text-tertiary)]">({profile.totalReviews})</span>
                )}
              </div>

              <span className="w-px h-3 bg-[var(--color-border-subtle)]" />

              {/* Experience */}
              <div className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
                <Clock className="w-3 h-3" />
                <span>{profile.yearsExperience || 0}{locale === 'ka' ? 'წ' : 'y'}</span>
              </div>

              {completedJobs > 0 && (
                <>
                  <span className="w-px h-3 bg-[var(--color-border-subtle)]" />
                  <div className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
                    <Briefcase className="w-3 h-3" />
                    <span>{completedJobs}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Like button */}
          {showLikeButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLike?.();
              }}
              className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200
                ${profile.isLiked
                  ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'
                }
              `}
            >
              <Heart className={`w-4 h-4 ${profile.isLiked ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Bottom Section - Bio preview and badges */}
        <div className="px-3 pb-3">
          {/* Bio */}
          {bioText && (
            <p className="text-[11px] leading-relaxed text-[var(--color-text-tertiary)] line-clamp-2 mb-2">
              {bioText}
            </p>
          )}

          {/* Tags row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {profile.categories.slice(0, 2).map((cat, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#D2691E]/8 text-[#D2691E] dark:bg-[#D2691E]/15"
              >
                {getCategoryLabel(cat)}
              </span>
            ))}
            {isTopRated && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" />
                Top
              </span>
            )}
          </div>
        </div>

        {/* Hover accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D2691E] to-[#CD853F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Link>
    );
  }

  // Horizontal variant - For list views
  if (variant === 'horizontal') {
    return (
      <Link
        href={`/professionals/${profile._id}`}
        className="pro-card-modern group flex items-center gap-4 p-4"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-[var(--color-border-subtle)] group-hover:ring-[#D2691E]/30 transition-all">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#D2691E]/20 to-[#CD853F]/30 flex items-center justify-center">
                <span className="text-xl font-bold text-[#D2691E]">{displayName.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${currentStatus.color} ring-2 ring-[var(--color-bg-elevated)]`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base text-[var(--color-text-primary)] truncate group-hover:text-[#D2691E] transition-colors">
              {displayName}
            </h3>
            {isPremium && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                PRO
              </span>
            )}
            {isTopRated && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" />
                Top
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {profile.title || getCategoryLabel(profile.categories[0])}
          </p>

          <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-[var(--color-text-primary)]">
                {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—'}
              </span>
              {profile.totalReviews > 0 && <span>({profile.totalReviews})</span>}
            </div>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {profile.yearsExperience}+ {locale === 'ka' ? 'წელი' : 'years'}
            </span>
            {completedJobs > 0 && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {completedJobs} {locale === 'ka' ? 'პროექტი' : 'jobs'}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {showLikeButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLike?.();
              }}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-all
                ${profile.isLiked
                  ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-500'
                }
              `}
            >
              <Heart className={`w-4 h-4 ${profile.isLiked ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Arrow */}
          <svg
            className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[#D2691E] group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Hover accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D2691E] to-[#CD853F] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Link>
    );
  }

  return null;
}
