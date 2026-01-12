"use client";

import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProProfile, ProStatus } from "@/types";
import { Briefcase, CheckCircle2, Clock, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const STATUS_CONFIG = {
  [ProStatus.ACTIVE]: {
    labelKey: "status.available",
    color: "bg-emerald-500",
    ringColor: "ring-emerald-500/30",
  },
  [ProStatus.BUSY]: {
    labelKey: "status.busy",
    color: "bg-amber-500",
    ringColor: "ring-amber-500/30",
  },
  [ProStatus.AWAY]: {
    labelKey: "status.away",
    color: "bg-neutral-400",
    ringColor: "ring-neutral-400/30",
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
}: ProCardProps) {
  const { t, locale } = useLanguage();
  const { getCategoryLabel } = useCategoryLabels();
  const { getSubcategoriesForCategory } = useCategories();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get the user's categories and subcategories
  const userCategories = useMemo(() =>
    (profile.selectedCategories?.length ? profile.selectedCategories : profile.categories) || [],
    [profile.selectedCategories, profile.categories]
  );

  const userSubcategories = useMemo(() =>
    (profile.selectedSubcategories?.length ? profile.selectedSubcategories : profile.subcategories) || [],
    [profile.selectedSubcategories, profile.subcategories]
  );

  // Filter subcategories that belong to a specific category
  const getSubcatsForCategory = useMemo(() => (categoryKey: string) => {
    const categorySubcats = getSubcategoriesForCategory(categoryKey);
    const categorySubcatKeys = categorySubcats.map(s => s.key);
    return userSubcategories.filter(subKey => categorySubcatKeys.includes(subKey));
  }, [getSubcategoriesForCategory, userSubcategories]);

  const currentStatus =
    STATUS_CONFIG[profile.status || ProStatus.AWAY] ||
    STATUS_CONFIG[ProStatus.AWAY];
  const isTopRated = profile.avgRating >= 4.8 && (profile.completedProjects || 0) >= 5;
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

  // Use the maximum of all available project count sources
  // This handles cases where counters weren't incremented for old projects
  const portfolioCount = profile.portfolioProjects?.length || 0;
  const externalJobs = profile.externalCompletedJobs || 0;
  const completedProjects = profile.completedProjects || 0;
  const completedJobsCounter = profile.completedJobs || 0;
  const completedJobs = Math.max(completedJobsCounter, portfolioCount, completedProjects, externalJobs);

  // Default/Compact variant
  if (variant === "compact" || variant === "default") {
    return (
      <Link href={`/professionals/${profile.id}`} className="group block">
        {/* Card Container with Premium Effects */}
        <div className={`relative transition-all duration-500 ${isPremium ? 'game-card-premium' : ''}`}>
          {/* Premium border glow effect */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/25 group-hover:via-[#D4937B]/15 group-hover:to-[#C4735B]/25 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />
          
          {/* Main Card */}
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100/80 dark:border-neutral-800 group-hover:border-[#C4735B]/20 transition-all duration-500 group-hover:shadow-[0_20px_50px_-12px_rgba(196,115,91,0.15)] group-hover:-translate-y-0.5 p-5">
            
            {/* Shine effect overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </div>

            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#C4735B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#C4735B]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100 pointer-events-none" />

            {/* Top Row - Badges */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5">
                {profile.verificationStatus === 'verified' && (
                  <StatusPill variant="verified" size="xs" locale={locale} />
                )}
                {isTopRated && (
                  <StatusPill variant="topRated" size="xs" locale={locale} label="Top" />
                )}
              </div>
              
              {/* Status badge on right */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${currentStatus.color} animate-pulse`} />
                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                  {t(currentStatus.labelKey)}
                </span>
              </div>
            </div>

            {/* Avatar - Centered with enhanced effects */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative group/avatar">
                {/* Avatar ring effect on hover */}
                <div className={`absolute -inset-1.5 rounded-full ${currentStatus.ringColor} ring-2 ring-transparent group-hover/avatar:ring-[#C4735B]/30 transition-all duration-300`} />
                
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 ring-2 ring-white dark:ring-neutral-900 shadow-lg group-hover:-translate-y-0.5 transition-transform duration-300">
                  {avatarUrl && !imageError ? (
                    <img
                      src={avatarUrl}
                      alt={profile.name}
                      className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-400 dark:text-neutral-500 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800">
                      {profile.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Status indicator - enhanced */}
                <span
                  className={`absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full ${currentStatus.color} border-[3px] border-white dark:border-neutral-900 shadow-md`}
                />
              </div>
            </div>

            {/* Name - Centered with animated underline */}
            <div className="text-center mb-3">
              <div className="relative inline-block">
                <h3 className="font-semibold text-[15px] text-neutral-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#C4735B] transition-colors duration-300">
                  {profile.name}
                </h3>
                {/* Animated underline */}
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-[#C4735B] via-[#D4937B] to-[#C4735B] group-hover:w-full transition-all duration-500 ease-out rounded-full" />
              </div>
            </div>

            {/* Rating or New Badge */}
            <div className="flex justify-center mb-4">
              {(profile.totalReviews || 0) > 0 ? (
                <StarRating
                  rating={profile.avgRating > 0 ? profile.avgRating : 5.0}
                  reviewCount={profile.totalReviews}
                  showCount
                  size="sm"
                />
              ) : (
                <Badge variant="success" size="xs" icon={<Sparkles className="w-3 h-3" />}>
                  {t('card.new')}
                </Badge>
              )}
            </div>

            {/* Stats Row - Enhanced */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-800/50 group-hover:bg-[#C4735B]/5 transition-colors duration-300">
                <Clock className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#C4735B]/70 transition-colors" />
                <span className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400">
                  {profile.yearsExperience || 0} {t('timeUnits.year')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-800/50 group-hover:bg-[#C4735B]/5 transition-colors duration-300">
                <Briefcase className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#C4735B]/70 transition-colors" />
                <span className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400">
                  {completedJobs} {t('common.jobs')}
                </span>
              </div>
            </div>

            {/* Divider - Enhanced */}
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent mb-4" />

            {/* Categories with Subcategories - Enhanced */}
            <div className="space-y-2.5">
              {userCategories.slice(0, 2).map((cat, i) => {
                const subcatsForThisCat = getSubcatsForCategory(cat);
                const displaySubcats = subcatsForThisCat.slice(0, 3);

                return (
                  <div key={i} className="text-center">
                    <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-[#C4735B] transition-colors duration-300">
                      {getCategoryLabel(cat)}
                    </span>
                    {displaySubcats.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mt-1.5">
                        {displaySubcats.map((subcat, j) => (
                          <span
                            key={j}
                            className="px-2.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-full group-hover:bg-[#C4735B]/10 group-hover:text-[#C4735B]/80 transition-colors duration-300"
                          >
                            {getCategoryLabel(subcat)}
                          </span>
                        ))}
                        {subcatsForThisCat.length > 3 && (
                          <span className="text-[10px] font-medium text-neutral-400 px-1.5">
                            +{subcatsForThisCat.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium Badge */}
          {isPremium && (
            <div className="absolute -top-1 -right-1 z-20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Horizontal variant - Enhanced
  if (variant === "horizontal") {
    return (
      <Link href={`/professionals/${profile.id}`} className="group block">
        <div className={`relative transition-all duration-500 ${isPremium ? 'game-card-premium' : ''}`}>
          {/* Premium border glow */}
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/20 group-hover:via-[#D4937B]/10 group-hover:to-[#C4735B]/20 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />
          
          <div className="relative bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-100/80 dark:border-neutral-800 group-hover:border-[#C4735B]/20 transition-all duration-500 group-hover:shadow-lg p-3.5">
            <div className="flex items-center gap-3.5">
              {/* Avatar - Enhanced */}
              <div className="relative flex-shrink-0 group/avatar">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 ring-2 ring-white dark:ring-neutral-800 shadow-md">
                  {avatarUrl && !imageError ? (
                    <img
                      src={avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-400">
                      {profile.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${currentStatus.color} border-2 border-white dark:border-neutral-900 shadow-sm`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-semibold text-[13px] text-neutral-900 dark:text-white truncate group-hover:text-[#C4735B] transition-colors duration-300">
                    {profile.name}
                  </h3>
                  {isPremium && (
                    <StatusPill variant="premium" size="xs" label="PRO" showIcon={false} />
                  )}
                  {profile.verificationStatus === 'verified' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mb-1.5">
                  {getCategoryLabel(userCategories[0])}
                </p>
                <div className="flex items-center gap-2.5 text-[11px]">
                  {(profile.totalReviews || 0) > 0 ? (
                    <StarRating
                      rating={profile.avgRating > 0 ? profile.avgRating : 5.0}
                      reviewCount={profile.totalReviews}
                      showCount
                      size="xs"
                    />
                  ) : (
                    <StatusPill variant="new" size="xs" locale={locale} />
                  )}
                  <span className="w-px h-3 bg-neutral-200 dark:bg-neutral-700" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {profile.yearsExperience || 0} {locale === "ka" ? "წ" : "yr"}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {completedJobs} {locale === "ka" ? "პრ" : "jobs"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Badge */}
          {isPremium && (
            <div className="absolute -top-1 -right-1 z-20">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
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
