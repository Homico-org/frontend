"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { ProProfile, ProStatus } from "@/types";
import Link from "next/link";
import { useState } from "react";

const STATUS_CONFIG = {
  [ProStatus.ACTIVE]: {
    label: { en: "Available", ka: "თავისუფალი" },
    color: "bg-emerald-500",
  },
  [ProStatus.BUSY]: {
    label: { en: "Busy", ka: "დაკავებული" },
    color: "bg-amber-500",
  },
  [ProStatus.AWAY]: {
    label: { en: "Away", ka: "არ არის" },
    color: "bg-neutral-400",
  },
};

interface ProCardProps {
  profile: ProProfile;
  variant?: "default" | "compact" | "horizontal";
  onLike?: () => void;
  showLikeButton?: boolean;
}

export default function ProCard({
  profile,
  variant = "default",
  onLike,
  showLikeButton = true,
}: ProCardProps) {
  const { t, locale } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const getCategoryLabel = (category: string) => {
    if (!category) return "";
    const translated = t(`categories.${category}`);
    if (translated === `categories.${category}`) {
      return category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return translated;
  };

  const currentStatus =
    STATUS_CONFIG[profile.status || ProStatus.AWAY] ||
    STATUS_CONFIG[ProStatus.AWAY];
  const isTopRated = profile.avgRating >= 4.8 && profile.completedProjects >= 5;
  const isPremium = profile.isPremium || false;

  // Avatar priority
  const isProfileAvatarBroken = profile.avatar?.includes("/uploads/");
  const rawAvatarUrl =
    (!isProfileAvatarBroken && profile.avatar) || profile?.avatar;
  const avatarUrl = rawAvatarUrl
    ? rawAvatarUrl.startsWith("http") || rawAvatarUrl.startsWith("data:")
      ? rawAvatarUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${rawAvatarUrl}`
    : null;

  const completedJobs = profile.completedJobs || 0;

  // Default/Compact variant
  if (variant === "compact" || variant === "default") {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block">
        <div className={`game-card-wrapper ${isPremium ? 'game-card-premium' : ''}`}>
          <div className="game-card-content bg-white dark:bg-neutral-900 rounded-lg overflow-hidden shadow-sm transition-shadow duration-300 border border-neutral-100 dark:border-neutral-800 p-4">
          {/* Top Row - Badges & Like */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {isTopRated && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Top
                </span>
              )}
            </div>

            {/* {showLikeButton && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLike?.();
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <svg
                  className={`w-4 h-4 ${likeCount > 0 ? "text-amber-500" : "text-neutral-400"}`}
                  fill={likeCount > 0 ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
            )} */}
          </div>

          {/* Avatar - Centered */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-neutral-400 dark:text-neutral-500">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Status indicator */}
              <span
                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full ${currentStatus.color} border-2 border-white dark:border-neutral-900`}
              />
            </div>
          </div>

          {/* Name - Centered */}
          <div className="text-center mb-3">
            <h3 className="font-semibold text-[15px] text-neutral-900 dark:text-white leading-snug line-clamp-1">
              {profile.name}
            </h3>
          </div>

          {/* Rating or New Badge */}
          <div className="flex justify-center mb-3">
            {(profile.totalReviews || 0) > 0 ? (
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[14px] font-semibold text-neutral-900 dark:text-white">
                  {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : "5.0"}
                </span>
                <span className="text-[11px] text-neutral-400">
                  ({profile.totalReviews})
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                {locale === "ka" ? "ახალი" : "New"}
              </span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-4 mb-3 text-[12px] text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {profile.yearsExperience || 0} {locale === "ka" ? "წ" : "yr"}
              </span>
            </div>
            <div className="w-px h-3 bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {completedJobs} {locale === "ka" ? "პრ" : "jobs"}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-neutral-100 dark:bg-neutral-800 mb-3" />

          {/* Categories with Subcategories */}
          <div className="space-y-2">
            {(profile.selectedCategories || profile.categories || []).slice(0, 2).map((cat, i) => {
              // Get subcategories for this category
              const subcats = (profile.selectedSubcategories || profile.subcategories || [])
                .slice(0, 3);

              return (
                <div key={i} className="text-center">
                  <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                    {getCategoryLabel(cat)}
                  </span>
                  {i === 0 && subcats.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {subcats.map((subcat, j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded"
                        >
                          {getCategoryLabel(subcat)}
                        </span>
                      ))}
                      {(profile.selectedSubcategories || profile.subcategories || []).length > 3 && (
                        <span className="text-[10px] text-neutral-400 px-1">
                          +{(profile.selectedSubcategories || profile.subcategories || []).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
          {/* Premium Ribbon - always visible */}
          {isPremium && (
            <div className="game-card-premium-symbol">
              <div className="premium-diamond-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Horizontal variant
  if (variant === "horizontal") {
    return (
      <Link href={`/professionals/${profile._id}`} className="group block">
        <div className={`game-card-wrapper ${isPremium ? 'game-card-premium' : ''}`}>
          <div className="game-card-content bg-white dark:bg-neutral-900 rounded-lg overflow-hidden shadow-sm transition-shadow duration-300 border border-neutral-100 dark:border-neutral-800 p-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-neutral-400">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${currentStatus.color} border-2 border-white dark:border-neutral-900`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-semibold text-[13px] text-neutral-900 dark:text-white truncate">
                  {profile.name}
                </h3>
                {isPremium && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mb-1">
                {getCategoryLabel(profile.selectedCategories[0])}
              </p>
              <div className="flex items-center gap-2 text-[11px]">
                {(profile.totalReviews || 0) > 0 ? (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : "5.0"}
                    </span>
                    <span className="text-neutral-400">({profile.totalReviews})</span>
                  </div>
                ) : (
                  <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                    {locale === "ka" ? "ახალი" : "New"}
                  </span>
                )}
                <span className="text-neutral-400">
                  {profile.yearsExperience || 0} {locale === "ka" ? "წ" : "yr"}
                </span>
                <span className="text-neutral-400">
                  {completedJobs} {locale === "ka" ? "პრ" : "jobs"}
                </span>
              </div>
            </div>

            {/* Save button */}
            {/* {showLikeButton && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLike?.();
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
              >
                <svg
                  className={`w-4 h-4 ${likeCount > 0 ? "text-amber-500" : "text-neutral-400"}`}
                  fill={likeCount > 0 ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
            )} */}
          </div>
          </div>
          {/* Premium Ribbon - always visible */}
          {isPremium && (
            <div className="game-card-premium-symbol">
              <div className="premium-diamond-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return null;
}
