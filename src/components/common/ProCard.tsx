"use client";

import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/StarRating";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { storage } from "@/services/storage";
import { ProProfile, ProStatus } from "@/types";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, Clock, Eye, Sparkles, Wallet } from "lucide-react";
import Image from "next/image";
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
  // Priority: selectedServices (new flow) > selectedSubcategories (old flow) > subcategories (fallback)
  const { userCategories, userSubcategories, servicesWithExperience } = useMemo(() => {
    // Check if user has new selectedServices structure
    const selectedServices = profile.selectedServices as Array<{
      key: string;
      name: string;
      nameKa: string;
      categoryKey: string;
      experience: string;
    }> | undefined;
    
    if (selectedServices && selectedServices.length > 0) {
      // Extract unique categories from selectedServices
      const categories = [...new Set(selectedServices.map(s => s.categoryKey))];
      // Extract subcategory keys
      const subcategories = selectedServices.map(s => s.key);
      return { 
        userCategories: categories, 
        userSubcategories: subcategories,
        servicesWithExperience: selectedServices
      };
    }
    
    // Fallback to old structure
    const categories = (profile.selectedCategories?.length ? profile.selectedCategories : profile.categories) || [];
    const subcategories = (profile.selectedSubcategories?.length ? profile.selectedSubcategories : profile.subcategories) || [];
    return { 
      userCategories: categories, 
      userSubcategories: subcategories,
      servicesWithExperience: null
    };
  }, [profile.selectedServices, profile.selectedCategories, profile.categories, profile.selectedSubcategories, profile.subcategories]);

  // Filter subcategories that belong to a specific category
  const getSubcatsForCategory = useMemo(() => (categoryKey: string) => {
    // If using new selectedServices, filter by categoryKey directly
    if (servicesWithExperience) {
      return servicesWithExperience
        .filter(s => s.categoryKey === categoryKey)
        .map(s => s.key);
    }
    // Fallback: filter using category definitions
    const categorySubcats = getSubcategoriesForCategory(categoryKey);
    const categorySubcatKeys = categorySubcats.map(s => s.key);
    return userSubcategories.filter(subKey => categorySubcatKeys.includes(subKey));
  }, [getSubcategoriesForCategory, userSubcategories, servicesWithExperience]);
  
  // Get experience label for a service
  const getServiceExperience = useMemo(() => (serviceKey: string): string | null => {
    if (!servicesWithExperience) return null;
    const service = servicesWithExperience.find(s => s.key === serviceKey);
    if (!service) return null;
    
    const expMap: Record<string, string> = {
      '1-2': `1-2${t('timeUnits.year')}`,
      '3-5': `3-5${t('timeUnits.year')}`,
      '5-10': `5-10${t('timeUnits.year')}`,
      '10+': `10+${t('timeUnits.year')}`,
    };
    return expMap[service.experience] || null;
  }, [servicesWithExperience, t]);

  const currentStatus =
    STATUS_CONFIG[profile.status || ProStatus.AWAY] ||
    STATUS_CONFIG[ProStatus.AWAY];
  const isTopRated = profile.avgRating >= 4.8 && (profile.completedProjects || 0) >= 5;
  const isPremium = profile.isPremium || false;

  // Avatar URL - use consistent storage.getFileUrl
  const avatarUrl = profile.avatar ? storage.getFileUrl(profile.avatar) : null;

  // Use the maximum of all available project count sources
  // This handles cases where counters weren't incremented for old projects
  const portfolioCount = profile.portfolioProjects?.length || 0;
  const portfolioItemCount = profile.portfolioItemCount || 0; // From PortfolioItem collection
  const externalJobs = profile.externalCompletedJobs || 0;
  const completedProjects = profile.completedProjects || 0;
  const completedJobsCounter = profile.completedJobs || 0;
  const completedJobs = Math.max(completedJobsCounter, portfolioCount, portfolioItemCount, completedProjects, externalJobs);

  // TODO: Temporary fix for pricing model
  const pricing = useMemo(() => {
    const model = (profile.pricingModel as unknown as string | undefined) || undefined;
    const base = typeof profile.basePrice === "number" ? profile.basePrice : undefined;
    const max = typeof profile.maxPrice === "number" ? profile.maxPrice : undefined;

    const hasBase = typeof base === "number" && base > 0;
    const hasMax = typeof max === "number" && max > 0;

    // Normalize legacy values to canonical product requirement:
    // fixed | range | byAgreement | per_sqm
    const normalizedIncoming =
      model === "hourly"
        ? "byAgreement"
        : model === "per_sqm" || model === "sqm"
          ? "per_sqm"
          : model === "daily" || model === "from"
            ? "fixed"
          : model === "project_based"
            ? "range"
            : model;

    const normalizedModel =
      normalizedIncoming === "range"
        ? hasBase && hasMax && max! > base!
          ? "range"
          : hasBase || hasMax
            ? "fixed"
            : "byAgreement"
        : normalizedIncoming === "per_sqm"
          ? hasBase || hasMax
            ? "per_sqm"
            : "byAgreement"
        : normalizedIncoming === "fixed"
          ? hasBase || hasMax
            ? "fixed"
            : "byAgreement"
          : normalizedIncoming === "byAgreement"
            ? "byAgreement"
            : undefined;

    if (normalizedModel === "byAgreement") {
      return {
        label: t("common.negotiable"),
        value: null as string | null,
      };
    }

    if (normalizedModel === "per_sqm" && (hasBase || hasMax)) {
      const val = hasBase ? base! : max!;
      return {
        label: t("professional.perSqm"),
        value: `${val}₾${t("timeUnits.perSqm")}`,
      };
    }

    if (normalizedModel === "range" && hasBase && hasMax) {
      return {
        label: t("common.priceRange"),
        value: `${base}₾ - ${max}₾`,
      };
    }

    if (normalizedModel === "fixed" && (hasBase || hasMax)) {
      const val = hasBase ? base! : max!;
      return {
        label: t("common.fixed"),
        value: `${val}₾`,
      };
    }

    return null;
  }, [profile.pricingModel, profile.basePrice, profile.maxPrice, t]);

  const viewsCount = profile.profileViewCount ?? 0;

  // Default/Compact variant
  if (variant === "compact" || variant === "default") {
    return (
      <Link href={`/professionals/${profile.id}`} className="group block h-full">
        {/* Card Container with Premium Effects */}
        <motion.div
          className={`relative transition-all duration-500 h-full ${isPremium ? 'game-card-premium' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Premium border glow effect - hidden on mobile for performance */}
          <div className="hidden sm:block absolute -inset-[1px] rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/25 group-hover:via-[#D4937B]/15 group-hover:to-[#C4735B]/25 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />

          {/* Main Card */}
          <div className="relative h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200/70 dark:border-neutral-800/80 shadow-sm sm:shadow-[0_1px_0_rgba(0,0,0,0.03),0_8px_24px_-18px_rgba(0,0,0,0.35)] group-hover:border-[#C4735B]/25 transition-all duration-500 sm:group-hover:shadow-[0_20px_50px_-12px_rgba(196,115,91,0.15)] sm:group-hover:-translate-y-0.5 p-3 sm:p-5">

            {/* Shine effect overlay - desktop only */}
            <div className="hidden sm:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            </div>

            {/* Top Row - Avatar + Info (Mobile: Horizontal layout) */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-center">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 ring-2 ring-white dark:ring-neutral-900 shadow-md">
                  {avatarUrl && !imageError ? (
                    <Image
                      src={avatarUrl}
                      alt={profile.name}
                      fill
                      sizes="(max-width: 640px) 48px, 80px"
                      className={`object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg sm:text-2xl font-bold text-neutral-400 dark:text-neutral-500">
                      {profile.name.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Status indicator */}
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full ${currentStatus.color} border-2 sm:border-[3px] border-white dark:border-neutral-900 shadow-sm`}
                />
              </div>

              {/* Info section */}
              <div className="flex-1 min-w-0 sm:w-full sm:text-center sm:mt-3">
                {/* Name + Badges */}
                <div className="flex items-center gap-1.5 sm:justify-center mb-0.5 sm:mb-1">
                  <h3 className="font-semibold text-sm sm:text-[15px] text-neutral-900 dark:text-white leading-snug truncate group-hover:text-[#C4735B] transition-colors duration-300">
                    {profile.name}
                  </h3>
                  {profile.verificationStatus === 'verified' && (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                  )}
                  {isTopRated && (
                    <span className="hidden sm:inline-flex">
                      <StatusPill variant="topRated" size="xs" locale={locale} label="Top" />
                    </span>
                  )}
                </div>

                {/* Mobile: Rating + Stats inline */}
                <div className="flex items-center gap-2 sm:hidden mb-1.5">
                  {(profile.totalReviews || 0) > 0 ? (
                    <StarRating
                      rating={profile.avgRating > 0 ? profile.avgRating : 5.0}
                      reviewCount={profile.totalReviews}
                      showCount
                      size="xs"
                    />
                  ) : (
                    <Badge variant="success" size="xs" icon={<Sparkles className="w-2.5 h-2.5" />}>
                      {t('card.new')}
                    </Badge>
                  )}
                  <span className="text-neutral-300 dark:text-neutral-600">·</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {(() => {
                      if (servicesWithExperience && servicesWithExperience.length > 0) {
                        const expToYears: Record<string, number> = { '1-2': 2, '3-5': 5, '5-10': 10, '10+': 15 };
                        const maxYears = Math.max(...servicesWithExperience.map(s => expToYears[s.experience] || 0));
                        return maxYears > 0 ? maxYears : (profile.yearsExperience || 0);
                      }
                      return profile.yearsExperience || 0;
                    })()}{t('timeUnits.year')}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">·</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                    <Briefcase className="w-3 h-3" />
                    {completedJobs}
                  </span>
                  {pricing && (
                    <>
                      <span className="text-neutral-300 dark:text-neutral-600">·</span>
                      <span className="text-[10px] font-medium text-[#C4735B]">
                        {pricing.value || pricing.label}
                      </span>
                    </>
                  )}
                </div>

                {/* Mobile: Subcategory pills */}
                <div className="sm:hidden flex flex-wrap gap-1">
                  {(userSubcategories.length > 0 ? userSubcategories : userCategories).slice(0, 4).map((key) => (
                    <span key={key} className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                      {getCategoryLabel(key)}
                    </span>
                  ))}
                  {userSubcategories.length > 4 && (
                    <span className="text-[10px] font-semibold text-[#C4735B] bg-[#C4735B]/10 px-1.5 py-0.5 rounded-full">
                      +{userSubcategories.length - 4}
                    </span>
                  )}
                </div>

                {/* Desktop: Rating */}
                <div className="hidden sm:flex items-center justify-center mb-1.5 sm:mb-3">
                  {(profile.totalReviews || 0) > 0 ? (
                    <StarRating
                      rating={profile.avgRating > 0 ? profile.avgRating : 5.0}
                      reviewCount={profile.totalReviews}
                      showCount
                      size="xs"
                    />
                  ) : (
                    <Badge variant="success" size="xs" icon={<Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}>
                      {t('card.new')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop: Full stats and categories */}
            <div className="hidden sm:block">
              {/* Stats Row */}
              <div className="flex items-center justify-center gap-3 mb-3 mt-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-50 dark:bg-neutral-800/50">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    {(() => {
                      if (servicesWithExperience && servicesWithExperience.length > 0) {
                        const expToYears: Record<string, number> = { '1-2': 2, '3-5': 5, '5-10': 10, '10+': 15 };
                        const maxYears = Math.max(...servicesWithExperience.map(s => expToYears[s.experience] || 0));
                        return maxYears > 0 ? maxYears : (profile.yearsExperience || 0);
                      }
                      return profile.yearsExperience || 0;
                    })()} {t('timeUnits.year')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-50 dark:bg-neutral-800/50">
                  <Briefcase className="w-3 h-3 text-neutral-400" />
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    {completedJobs} {t('admin.job')}
                  </span>
                </div>
              </div>

              {/* Pricing */}
              {pricing && (
                <div className="flex justify-center mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C4735B]/10 border border-[#C4735B]/20">
                    <Wallet className="w-3 h-3 text-[#C4735B]" />
                    <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
                      {pricing.value ? (
                        <span className="text-[#C4735B]">{pricing.value}</span>
                      ) : (
                        pricing.label
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent mb-3" />

              {/* Categories with Subcategories - Enhanced Display */}
              <div className="space-y-2">
                {(() => {
                  // Collect all subcategories across all categories
                  const allSubcats = userCategories.flatMap(cat =>
                    getSubcatsForCategory(cat).map(subKey => ({ subKey, catKey: cat }))
                  );
                  const totalSubcats = allSubcats.length;

                  // If 4 or fewer subcategories, show them all in a flowing layout
                  if (totalSubcats <= 4) {
                    return (
                      <motion.div
                        className="flex flex-wrap justify-center gap-1.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        {allSubcats.map(({ subKey }, j) => (
                          <motion.span
                            key={j}
                            className="px-2.5 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-800/50 rounded-full border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + j * 0.05 }}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(196, 115, 91, 0.1)" }}
                          >
                            {getCategoryLabel(subKey)}
                          </motion.span>
                        ))}
                      </motion.div>
                    );
                  }

                  // If more than 4 subcategories, show first 3 + overflow badge
                  const displaySubcats = allSubcats.slice(0, 3);
                  const remaining = totalSubcats - 3;

                  return (
                    <motion.div
                      className="flex flex-wrap justify-center gap-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {displaySubcats.map(({ subKey }, j) => (
                        <motion.span
                          key={j}
                          className="px-2.5 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-800/50 rounded-full border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + j * 0.05 }}
                          whileHover={{ scale: 1.05, backgroundColor: "rgba(196, 115, 91, 0.1)" }}
                        >
                          {getCategoryLabel(subKey)}
                        </motion.span>
                      ))}
                      <motion.span
                        className="px-2.5 py-1 text-[10px] font-semibold text-[#C4735B] bg-[#C4735B]/10 rounded-full border border-[#C4735B]/20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        +{remaining} {t('common.more')}
                      </motion.span>
                    </motion.div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Premium Badge */}
          {isPremium && (
            <motion.div
              className="absolute -top-1 -right-1 z-20"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4 text-white">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Link>
    );
  }

  // Horizontal variant - Enhanced
  if (variant === "horizontal") {
    return (
      <Link href={`/professionals/${profile.id}`} className="group block h-full">
        <motion.div
          className={`relative transition-all duration-500 h-full ${isPremium ? 'game-card-premium' : ''}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Premium border glow */}
          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/20 group-hover:via-[#D4937B]/10 group-hover:to-[#C4735B]/20 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />

          <div className="relative h-full bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200/70 dark:border-neutral-800/80 shadow-[0_1px_0_rgba(0,0,0,0.03),0_10px_24px_-22px_rgba(0,0,0,0.35)] group-hover:border-[#C4735B]/25 transition-all duration-500 group-hover:shadow-lg p-3.5">
            <div className="flex items-center gap-3.5">
              {/* Avatar - Enhanced */}
              <div className="relative flex-shrink-0 group/avatar">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 ring-2 ring-white dark:ring-neutral-800 shadow-md">
                  {avatarUrl && !imageError ? (
                    <Image
                      src={avatarUrl}
                      alt={profile.name}
                      fill
                      sizes="56px"
                      className="object-cover transition-transform duration-300 group-hover/avatar:scale-105"
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
                {profile.bio ? (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mb-1.5">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mb-1.5">
                    {getCategoryLabel(userCategories[0])}
                  </p>
                )}
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
                    {(() => {
                      if (servicesWithExperience && servicesWithExperience.length > 0) {
                        const expToYears: Record<string, number> = { '1-2': 2, '3-5': 5, '5-10': 10, '10+': 15 };
                        const maxYears = Math.max(...servicesWithExperience.map(s => expToYears[s.experience] || 0));
                        return maxYears > 0 ? maxYears : (profile.yearsExperience || 0);
                      }
                      return profile.yearsExperience || 0;
                    })()} {t('timeUnits.year')}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {completedJobs} {t('admin.jobs')}
                  </span>
                  <span className="text-neutral-400 dark:text-neutral-600">•</span>
                  {pricing && (
                    <span className="inline-flex items-center gap-1 text-[#C4735B] dark:text-[#D4937B] font-semibold">
                      <Wallet className="w-3.5 h-3.5" />
                      {pricing.value ? pricing.value : pricing.label}
                    </span>
                  )}
                  <span className="text-neutral-400 dark:text-neutral-600">•</span>
                  <span className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-400 font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    {viewsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Badge */}
          {isPremium && (
            <motion.div
              className="absolute -top-1 -right-1 z-20"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Link>
    );
  }

  return null;
}
