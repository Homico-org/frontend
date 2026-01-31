"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { storage } from "@/services/storage";
import type { Job } from "@/types/shared";
import { formatCurrency, formatPriceRange } from "@/utils/currencyUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, MessageSquare } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

export interface MyJobCardProps {
  job: Job;
}

const MyJobCard = React.memo(function MyJobCard({
  job,
}: MyJobCardProps) {
  const { getCategoryLabel, locale } = useCategoryLabels();
  const { t } = useLanguage();
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get first image
  const firstImage = useMemo(() => {
    const mediaImages = Array.isArray(job.media)
      ? job.media.filter((m) => m.type === "image").map((m) => m.url)
      : [];
    const jobImages = Array.isArray(job.images) ? job.images : [];
    return mediaImages[0] || jobImages[0] || null;
  }, [job.media, job.images]);

  const getImageSrc = (img: string) => {
    if (!img) return "";
    return storage.getJobCardImageUrl(img);
  };

  const formattedBudget = useMemo(() => {
    if (job.budgetType === "fixed") {
      // Check budgetAmount first, then fall back to budgetMin (used by job posting form)
      const amount = job.budgetAmount ?? job.budgetMin;
      if (amount) return formatCurrency(amount);
    } else if (job.budgetType === "per_sqm" && job.pricePerUnit) {
      const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
      if (total) return formatCurrency(total);
      return `${job.pricePerUnit}₾/მ²`;
    } else if (job.budgetType === "range" && job.budgetMin && job.budgetMax) {
      return formatPriceRange(job.budgetMin, job.budgetMax);
    }
    return t('card.negotiable');
  }, [job.budgetType, job.budgetAmount, job.pricePerUnit, job.areaSize, job.budgetMin, job.budgetMax, t]);

  const timeAgo = useMemo(() => {
    const seconds = Math.floor((new Date().getTime() - new Date(job.createdAt).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t("timeUnits.minute")}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t("timeUnits.hour")}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${t("timeUnits.day")}`;
    return `${Math.floor(seconds / 604800)}${t("timeUnits.week")}`;
  }, [job.createdAt, t]);

  const truncateLocation = (loc: string) => {
    if (!loc) return "";
    const parts = loc.split(",");
    return parts[0]?.trim() || loc.substring(0, 15);
  };

  const proposalCount = job.proposalCount ?? 0;
  const viewCount = job.viewCount ?? 0;

  return (
    <div className="group relative">
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="bg-white dark:bg-neutral-900 rounded-lg sm:rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 sm:hover:shadow-md">

          {/* Compact Header with Image */}
          <div className="flex gap-2 sm:gap-3 p-2 sm:p-3">
            {/* Thumbnail */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-md sm:rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
              {firstImage && !imageError ? (
                <>
                  <img
                    src={getImageSrc(firstImage)}
                    alt={job.title}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                  {!imageLoaded && <Skeleton className="absolute inset-0" />}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4846C] to-[#A85D4A]">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white/80" viewBox="0 0 56 60" fill="none">
                    <rect x="0" y="0" width="8" height="40" rx="2" fill="currentColor" />
                    <rect x="32" y="0" width="8" height="40" rx="2" fill="currentColor" />
                    <path d="M8 20 Q20 5 32 20" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white leading-tight line-clamp-1 mb-0.5 sm:mb-1">
                {job.title}
              </h3>

              {/* Category - Location hidden on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mb-1 sm:mb-1.5">
                <span className="truncate">{getCategoryLabel(job.category)}</span>
                {job.location && (
                  <span className="hidden sm:inline-flex items-center gap-1.5">
                    <span>·</span>
                    <span className="truncate">{truncateLocation(job.location)}</span>
                  </span>
                )}
              </div>

              {/* Budget */}
              <div className="text-xs sm:text-sm font-semibold text-[#C4735B]">
                {formattedBudget}
              </div>
            </div>
          </div>

          {/* Stats Footer - compact on mobile */}
          <div className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Proposals */}
              <div className={`flex items-center gap-1 sm:gap-1.5 ${proposalCount > 0 ? 'text-[#C4735B]' : 'text-neutral-400'}`}>
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs font-medium">
                  {proposalCount}
                  <span className="hidden sm:inline"> {locale === 'ka' ? 'შეთავაზება' : 'proposals'}</span>
                </span>
              </div>

              {/* Views */}
              <div className="flex items-center gap-1 sm:gap-1.5 text-neutral-400">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs font-medium">{viewCount}</span>
              </div>
            </div>

            {/* Time */}
            <span className="text-[10px] sm:text-xs text-neutral-400">
              {timeAgo}
            </span>
          </div>
        </div>
      </Link>

      {/* Proposal notification badge */}
      {proposalCount > 0 && (
        <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 px-1 sm:px-1.5 rounded-full bg-[#C4735B] text-white text-[10px] sm:text-xs font-semibold flex items-center justify-center shadow-sm">
          {proposalCount > 99 ? '99+' : proposalCount}
        </div>
      )}
    </div>
  );
});

export default MyJobCard;
