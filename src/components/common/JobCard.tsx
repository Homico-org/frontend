/* eslint-disable @next/next/no-img-element -- Cloudinary-served + onError fallback; next/image conversion deferred until perf audit. */
"use client";

import Avatar from "@/components/common/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCategories } from "@/contexts/CategoriesContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { storage } from "@/services/storage";
import type { Job } from "@/types/shared";
import { formatCurrency, formatPriceRange } from "@/utils/currencyUtils";
import { currencySymbol } from "@/utils/currency";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCity } from "@/data/cities";
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
  const { getCategoryLabel } = useCategoryLabels();
  const { t, pick, locale } = useLanguage();
  const { categories: catalogCats } = useCategories();

  // Catalog-aware label lookup
  const getLabel = useCallback((key: string): string => {
    for (const cat of catalogCats) {
      if (cat.key === key) return pick({ en: cat.name, ka: cat.nameKa });
      for (const sub of cat.subcategories) {
        if (sub.key === key) return pick({ en: sub.name, ka: sub.nameKa });
        for (const svc of (sub.services || [])) {
          if (svc.key === key) return pick({ en: svc.name, ka: svc.nameKa });
        }
      }
    }
    return getCategoryLabel(key);
  }, [catalogCats, pick, getCategoryLabel]);

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

  // Compute services total if available
  const servicesTotal = useMemo(() => {
    if (!job.services || job.services.length === 0) return 0;
    return job.services.reduce((sum, s) => sum + s.unitPrice * (s.quantity || 1), 0);
  }, [job.services]);

  const formattedBudget = useMemo(() => {
    // Use services total if services exist
    if (servicesTotal > 0) return formatCurrency(servicesTotal);
    if (job.budgetType === "fixed") {
      const amount = job.budgetAmount ?? job.budgetMin;
      if (amount) return formatCurrency(amount);
    } else if (job.budgetType === "per_sqm" && job.pricePerUnit) {
      const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
      if (total) return formatCurrency(total);
      return `${job.pricePerUnit}${currencySymbol({ country: job.country ?? 'GE' })}/მ²`;
    } else if (job.budgetType === "range" && job.budgetMin && job.budgetMax) {
      return formatPriceRange(job.budgetMin, job.budgetMax);
    }
    return t("card.negotiable");
  }, [servicesTotal, job.budgetType, job.budgetAmount, job.pricePerUnit, job.areaSize, job.budgetMin, job.budgetMax, job.country, t]);

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
    const head = parts[0]?.trim() || loc.substring(0, 20);
    // If the first comma-segment is a known city in any supported
    // marketplace, swap it to the active locale's variant - so a job
    // stored as "Paris, France" reads as "პარიზი" on /fr in ka locale.
    return translateCity(head, locale);
  };

  const isExpired =
    !!job.deadline && new Date(job.deadline).getTime() < Date.now();
  const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft > 0;

  return (
    <Link href={`/${(job.country ?? 'GE').toLowerCase()}/jobs/${job.id}`} className="group block h-full">
      <motion.div
        ref={cardRef}
        className="relative h-full flex flex-col bg-[var(--hm-bg-elevated)] rounded-xl overflow-hidden border border-[var(--hm-border-subtle)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-lg"
        style={{
          boxShadow:
            "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Main card layout */}
        <div className="flex flex-col flex-1">

          {/* Image section - only if has images */}
          {hasImages && (
            <div className="relative aspect-[16/9] bg-[var(--hm-bg-tertiary)] overflow-hidden">
              {/* Shimmer loading */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-[var(--hm-border)] via-[var(--hm-bg-tertiary)] to-[var(--hm-border)] animate-shimmer bg-[length:200%_100%] transition-opacity duration-500 ${
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
                    className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4 text-[var(--hm-fg-secondary)]" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4 text-[var(--hm-fg-secondary)]" />
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
          <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 sm:gap-2 flex-1">
            {/* Top row: Category + badges + time. Right padding reserves
                space for the absolutely-positioned save (Bookmark) button
                so the timeAgo doesn't slide underneath it. */}
            <div className="flex items-center gap-1.5 flex-wrap pr-9">
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
                {getLabel(job.category)}
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
              <span className="ml-auto text-[10px] sm:text-[11px] text-[var(--hm-fg-muted)] flex items-center gap-0.5 sm:gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {timeAgo}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-[13px] sm:text-sm text-[var(--hm-fg-primary)] leading-snug line-clamp-2 group-hover:text-[var(--hm-brand-500)] transition-colors">
              {job.title}
            </h3>

            {/* Description. Was `hidden sm:block` which made the
                mobile card render with only title + bottom row, looking
                visually empty against the page. Now visible on mobile
                with a tighter 1-line clamp; desktop keeps the 2-line
                clamp via the responsive `sm:line-clamp-2`. */}
            {job.description && (
              <p className="text-[12px] sm:text-[13px] text-[var(--hm-fg-muted)] line-clamp-1 sm:line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            )}

            {/* Services breakdown. Show up to 2 service chips on
                mobile so the user has signal about what the job
                actually contains; desktop keeps showing all. */}
            {job.services && job.services.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.services.map((svc, i) => {
                  const svcName = getLabel(svc.key);
                  const qty = svc.quantity || 1;
                  // On mobile, cap to 2 service chips to keep card height
                  // tight. The full list is on the detail page anyway.
                  const hiddenOnMobile = i >= 2;
                  return (
                    <span
                      key={`${svc.key}-${i}`}
                      className={`${hiddenOnMobile ? "hidden sm:inline-flex" : "inline-flex"} items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]`}
                    >
                      {svcName}
                      {qty > 1 && <span className="opacity-60">×{qty}</span>}
                      {svc.unitPrice > 0 && <span className="text-[var(--hm-brand-500)] font-bold">{svc.unitPrice * qty}{currencySymbol({ country: job.country ?? 'GE' })}</span>}
                    </span>
                  );
                })}
                {/* "+N more" indicator on mobile when services were
                    capped, so the user knows there's more behind it. */}
                {job.services.length > 2 && (
                  <span className="sm:hidden inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]">
                    +{job.services.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Meta info row - now visible on mobile too. The
                "Mukhiani M/D-4b, #29..." string was previously hidden
                on mobile entirely, making the card read as anonymous;
                surfacing it gives the viewer at-a-glance proximity. */}
            {job.location && (
              <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-[var(--hm-fg-muted)]">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-[var(--hm-fg-muted)]" />
                <span className="truncate">{truncateLocation(job.location)}</span>
              </div>
            )}

            {/* Divider - hidden on mobile */}
            <div className="hidden sm:block h-px bg-[var(--hm-bg-tertiary)]" />

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
                <span className="hidden sm:inline text-[12px] text-[var(--hm-fg-secondary)] truncate">
                  {job.clientId?.name?.split(" ")[0] || t("card.client")}
                </span>
              </div>

              {/* Budget - prominent */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Stats. Proposal count shows on mobile too because
                    it's strong competitive signal for pros browsing.
                    Views stay desktop-only - they add noise on small
                    cards and proposals carry more meaning. */}
                <div className="flex items-center gap-2 text-[var(--hm-fg-muted)]">
                  {job.proposalCount > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px]">
                      <Send className="w-3 h-3" />
                      {job.proposalCount}
                    </span>
                  )}
                  {job.viewCount > 0 && (
                    <span className="hidden sm:flex items-center gap-0.5 text-[11px]">
                      <Eye className="w-3 h-3" />
                      {job.viewCount}
                    </span>
                  )}
                </div>

                {/* Budget badge */}
                <span className="px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-md text-[var(--hm-brand-500)]">
                  {formattedBudget}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save button - floating */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave?.(job.id);
          }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            hasImages
              ? "bg-white/90"
              : "bg-[var(--hm-bg-tertiary)]"
          }`}
        >
          <Bookmark
            className={`w-3.5 h-3.5 transition-colors ${
              isSaved
                ? "fill-amber-500 text-[var(--hm-warning-500)]"
                : "text-[var(--hm-fg-muted)]"
            }`}
          />
        </button>
      </motion.div>
    </Link>
  );
});

export default JobCard;
