"use client";

import Avatar from "@/components/common/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { storage } from "@/services/storage";
import type { Job } from "@/types/shared";
import { formatCurrency, formatPriceRange } from "@/utils/currencyUtils";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Bookmark,
  Clock,
  Eye,
  MapPin,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface JobCardProps {
  job: Job;
  variant?: "default" | "compact" | "list";
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
  hasApplied?: boolean;
}

const JobCard = React.memo(function JobCard({
  job,
  onSave,
  isSaved = false,
  hasApplied = false,
}: JobCardProps) {
  const { getCategoryLabel, locale } = useCategoryLabels();
  const { t } = useLanguage();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Memoize combined images array
  const allImages = useMemo(() => {
    const mediaImages = Array.isArray(job.media)
      ? job.media.filter((m) => m.type === "image").map((m) => m.url)
      : [];
    const jobImages = Array.isArray(job.images) ? job.images : [];
    return [
      ...mediaImages,
      ...jobImages.filter((img) => !mediaImages.includes(img)),
    ];
  }, [job.media, job.images]);

  const hasImages = allImages.length > 0 && !imageError;
  const hasMultipleImages = allImages.length > 1;

  const getImageSrc = (img: string) => {
    if (!img) return "";
    return storage.getJobCardImageUrl(img);
  };

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    const createdDate = new Date(job.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    setIsNew(hoursDiff < 24);

    if (job.deadline) {
      const deadline = new Date(job.deadline);
      const diff = deadline.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(days < 0 ? 0 : days);
    }
  }, [job.createdAt, job.deadline]);

  const formattedBudget = useMemo(() => {
    if (job.budgetType === "fixed") {
      const amount = job.budgetAmount ?? job.budgetMin;
      if (amount) return formatCurrency(amount);
    } else if (job.budgetType === "per_sqm" && job.pricePerUnit) {
      const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
      if (total) return formatCurrency(total);
      return `${job.pricePerUnit}₾/მ²`;
    } else if (job.budgetType === "range" && job.budgetMin && job.budgetMax) {
      return formatPriceRange(job.budgetMin, job.budgetMax);
    }
    return t("card.negotiable");
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
    return parts[0]?.trim() || loc.substring(0, 20);
  };

  const isExpired =
    !!job.deadline && new Date(job.deadline).getTime() < Date.now();
  const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft > 0;

  return (
    <Link href={`/jobs/${job.id}`} className="group block h-full">
      <motion.div
        ref={cardRef}
        className={`
          relative h-full flex flex-col bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden
          border border-neutral-200/70 dark:border-neutral-800
          shadow-sm hover:shadow-lg hover:shadow-neutral-900/[0.08] dark:hover:shadow-black/30
          transition-all duration-300
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Main card layout */}
        <div className="flex flex-col flex-1">

          {/* Image section - only if has images */}
          {hasImages && (
            <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              {/* Shimmer loading */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 animate-shimmer bg-[length:200%_100%] transition-opacity duration-500 ${
                  imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              />

              {isInView && (
                <img
                  src={getImageSrc(allImages[currentImageIndex])}
                  alt={job.title}
                  loading="lazy"
                  decoding="async"
                  className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02] ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              )}

              {/* Image navigation - hidden on mobile */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-black/60 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-700 dark:text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-black/60 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-700 dark:text-white" />
                  </button>
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {allImages.slice(0, 5).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors ${
                          idx === currentImageIndex ? "bg-white" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Image count badge */}
              {hasMultipleImages && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[9px] sm:text-[10px] font-medium text-white">
                  {currentImageIndex + 1}/{allImages.length}
                </div>
              )}
            </div>
          )}

          {/* Content section */}
          <div className="p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3 flex-1">
            {/* Top row: Category + badges + time */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded bg-[#C4735B]/10 text-[#C4735B]">
                {getCategoryLabel(job.category)}
              </span>
              {isNew && !hasApplied && (
                <StatusPill variant="new" size="xs" locale={locale} />
              )}
              {isUrgent && !isExpired && (
                <span className="hidden sm:inline-flex">
                  <StatusPill variant="urgent" size="xs" locale={locale} />
                </span>
              )}
              {hasApplied && (
                <StatusPill variant="applied" size="xs" locale={locale} />
              )}
              <span className="ml-auto text-[10px] sm:text-[11px] text-neutral-400 flex items-center gap-0.5 sm:gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {timeAgo}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-[13px] sm:text-[15px] text-neutral-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#C4735B] transition-colors">
              {job.title}
            </h3>

            {/* Description - hidden on mobile */}
            {job.description && (
              <p className="hidden sm:block text-[13px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            )}

            {/* Meta info row - hidden on mobile */}
            {job.location && (
              <div className="hidden sm:flex items-center gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
                <span className="truncate">{truncateLocation(job.location)}</span>
              </div>
            )}

            {/* Divider - hidden on mobile */}
            <div className="hidden sm:block h-px bg-neutral-100 dark:bg-neutral-800" />

            {/* Bottom row: Client + Budget + Stats */}
            <div className="flex items-center justify-between mt-auto">
              {/* Client info - smaller on mobile */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Avatar
                  src={job.clientId?.avatar}
                  name={job.clientId?.name || "C"}
                  size="xs"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
                <span className="hidden sm:inline text-[12px] text-neutral-600 dark:text-neutral-300 truncate">
                  {job.clientId?.name?.split(" ")[0] || t("card.client")}
                </span>
              </div>

              {/* Budget - prominent */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Stats - hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2 text-neutral-400">
                  {job.proposalCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px]">
                      <Send className="w-3 h-3" />
                      {job.proposalCount}
                    </span>
                  )}
                  {job.viewCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px]">
                      <Eye className="w-3 h-3" />
                      {job.viewCount}
                    </span>
                  )}
                </div>

                {/* Budget badge */}
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-[13px] font-bold rounded-md sm:rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                  {formattedBudget}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save button - floating */}
        <motion.button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave?.(job.id);
          }}
          className={`
            absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center
            transition-all duration-200
            ${hasImages
              ? "bg-white/90 dark:bg-black/60 shadow-sm"
              : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }
          `}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={isSaved ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Bookmark
              className={`w-3 h-3 sm:w-4 sm:h-4 transition-colors ${
                isSaved
                  ? "fill-amber-500 text-amber-500"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            />
          </motion.div>
        </motion.button>
      </motion.div>
    </Link>
  );
});

export default JobCard;
