"use client";

import Avatar from "@/components/common/Avatar";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { Skeleton } from "@/components/ui/Skeleton";
import { StarRating } from "@/components/ui/StarRating";
import { StatusPill } from "@/components/ui/StatusPill";
import { ACCENT_COLOR } from "@/constants/theme";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryLabelStatic } from "@/hooks/useCategoryLabels";
import { storage } from "@/services/storage";
import { FeedItem, FeedItemType } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Globe,
  ImageIcon,
  Play,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Auto-slide interval in milliseconds
const AUTO_SLIDE_INTERVAL = 4000;

interface FeedCardProps {
  item: FeedItem;
  onLike?: (likeTargetType?: string, likeTargetId?: string) => void;
  isAuthenticated?: boolean;
  locale?: string;
}

const FeedCard = React.memo(function FeedCard({
  item,
  locale = "en",
}: FeedCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1); // 1 = forward, -1 = backward
  const [isHovered, setIsHovered] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  const { t, pick } = useLanguage();
  const { categories } = useCategories();

  // Build service key → localized name map from catalog
  const svcNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories) {
      map[cat.key] = pick({ en: cat.name, ka: cat.nameKa });
      for (const sub of cat.subcategories || []) {
        map[sub.key] = pick({ en: sub.name, ka: sub.nameKa });
        for (const svc of sub.services || []) {
          map[svc.key] = pick({ en: svc.name, ka: svc.nameKa });
        }
      }
    }
    return map;
  }, [categories, pick]);

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasVideos = item.videos && item.videos.length > 0;
  const hasMultipleImages = item.images.length > 1 || hasVideos;
  // Support both direct beforeImage/afterImage and beforeAfterPairs array
  const firstPair = item.beforeAfterPairs?.[0];
  const beforeImage = item.beforeImage || firstPair?.beforeImage || (firstPair as { before?: string })?.before;
  const afterImage = item.afterImage || firstPair?.afterImage || (firstPair as { after?: string })?.after;
  const isBeforeAfter = !!(beforeImage && afterImage);
  // Combine images and videos for navigation
  const allMedia = [...item.images, ...(item.videos || [])];
  const totalImages = allMedia.length;

  // Auto-slide effect
  useEffect(() => {
    if (!hasMultipleImages || isHovered || isBeforeAfter) return;

    autoSlideRef.current = setInterval(() => {
      setSlideDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }, AUTO_SLIDE_INTERVAL);

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [hasMultipleImages, isHovered, isBeforeAfter, totalImages]);

  // Check if this is a new item (created within last 14 days and no rating)
  const isNew = useMemo(() => {
    if (item.pro.rating && item.pro.rating > 0) return false;
    if (!item.createdAt) return true; // Default to new if no date
    const createdDate = new Date(item.createdAt);
    const now = new Date();
    const daysDiff =
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff < 14;
  }, [item.pro.rating, item.createdAt]);

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSlideDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    },
    [totalImages]
  );

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSlideDirection(-1);
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    },
    [totalImages]
  );

  // Go to specific slide
  const goToSlide = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSlideDirection(index > currentImageIndex ? 1 : -1);
      setCurrentImageIndex(index);
    },
    [currentImageIndex]
  );


  // Get category label — try catalog lookup first, then static labels
  const getCategoryLabel = () => {
    const category = item.category || "design";
    return svcNameMap[category] || getCategoryLabelStatic(category, locale);
  };

  // Check if pro is premium (if available in the data)
  const isPremium = (item.pro as { isPremium?: boolean })?.isPremium || false;

  // Handle both id and _id for pro (backend may return either)
  const proId = item.pro.id || (item.pro as { _id?: string })._id;

  return (
    <Link href={`/professionals/${proId}`} className="group block h-full">
      {/* Card Container with Premium Effects */}
      <motion.div
        className={`relative transition-all duration-500 h-full ${isPremium ? "game-card-premium" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Premium border glow effect - hidden on mobile for performance */}
        <div className="hidden sm:block absolute -inset-[1px] rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--hm-brand-500)]/0 via-[var(--hm-brand-500)]/0 to-[var(--hm-brand-500)]/0 group-hover:from-[var(--hm-brand-500)]/30 group-hover:via-[#F06B43]/15 group-hover:to-[var(--hm-brand-500)]/30 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-[1px]" />

        {/* Main Card */}
        <div className="relative h-full flex flex-col bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)] shadow-sm sm:shadow-[0_1px_0_rgba(0,0,0,0.03),0_8px_24px_-18px_rgba(0,0,0,0.35)] group-hover:border-[var(--hm-brand-500)]/25 transition-all duration-500 sm:group-hover:shadow-[0_20px_50px_-12px_rgba(239,78,36,0.15)]">
          {/* Shine effect overlay - desktop only */}
          <div className="hidden sm:block absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          </div>

          {/* Decorative corner accent - desktop only */}
          <div className="hidden sm:block absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--hm-brand-500)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

          {/* Image Section */}
          <div className="relative">
            {/* Source Badge - Homico Verified or External */}
            {item.isVerified !== undefined && (
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
                {item.isVerified ? (
                  <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[var(--hm-success-500)]/90 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-semibold shadow-lg border border-white/20">
                    <BadgeCheck className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">{t("browse.viaHomico")}</span>
                    <span className="sm:hidden">✓</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-medium shadow-lg border border-white/10">
                    <Globe className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">{t("browse.external")}</span>
                  </div>
                )}
              </div>
            )}

            {isBeforeAfter ? (
              <BeforeAfterSlider
                beforeImage={storage.getFeedCardImageUrl(beforeImage)}
                afterImage={storage.getFeedCardImageUrl(afterImage)}
                sizes="(max-width: 640px) 100vw, 400px"
              />
            ) : (
              <div
                className="relative aspect-[4/3] bg-[var(--hm-bg-tertiary)] overflow-hidden"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Animated Image Carousel */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {!imageError &&
                  allMedia.length > 0 &&
                  allMedia[currentImageIndex] ? (
                    (() => {
                      const currentMedia = allMedia[currentImageIndex];
                      const isVideo =
                        currentMedia.includes(".mp4") ||
                        currentMedia.includes(".mov") ||
                        currentMedia.includes(".webm") ||
                        currentMedia.startsWith("data:video");

                      if (isVideo) {
                        return (
                          <motion.div
                            key={`video-${currentImageIndex}`}
                            initial={{ opacity: 0, x: slideDirection * 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: slideDirection * -100 }}
                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            className="absolute inset-0"
                          >
                            <video
                              src={storage.getFeedCardImageUrl(currentMedia)}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              loop
                              autoPlay={isHovered}
                              onMouseEnter={(e) => e.currentTarget.play()}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                              }}
                            />
                            {/* Video play icon overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                              <motion.div
                                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl"
                                whileHover={{ scale: 1.1 }}
                              >
                                <Play className="w-6 h-6 text-white ml-0.5 fill-white" />
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={`image-${currentImageIndex}`}
                          initial={{ opacity: 0, scale: 1.1, x: slideDirection * 50 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95, x: slideDirection * -50 }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={storage.getFeedCardImageUrl(currentMedia)}
                            alt={item.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 400px"
                            loading="lazy"
                            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                          />
                        </motion.div>
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--hm-bg-tertiary)] to-[var(--hm-border)]">
                      <ImageIcon
                        className="w-12 h-12 text-[var(--hm-n-300)]"
                        strokeWidth={1}
                      />
                    </div>
                  )}
                </AnimatePresence>

                {/* Loading placeholder */}
                {!imageLoaded && !imageError && allMedia.length > 0 && (
                  <Skeleton className="absolute inset-0 z-10" />
                )}

                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

                {/* Image navigation arrows - show on hover */}
                {hasMultipleImages && (
                  <>
                    <motion.button
                      onClick={prevImage}
                      className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm items-center justify-center shadow-lg z-20"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,1)" }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronLeft className="w-5 h-5 text-[var(--hm-fg-secondary)]" />
                    </motion.button>
                    <motion.button
                      onClick={nextImage}
                      className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm items-center justify-center shadow-lg z-20"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,1)" }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5 text-[var(--hm-fg-secondary)]" />
                    </motion.button>

                    {/* Image Counter Indicator */}
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-20">
                      <div className="flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-2.5 sm:py-1.5 rounded-full bg-black/55 backdrop-blur-md">
                        {/* Progress bar - hidden on mobile */}
                        <div className="hidden sm:block w-12 h-1 rounded-full bg-white/30 overflow-hidden">
                          <motion.div
                            className="h-full bg-[var(--hm-bg-elevated)] rounded-full"
                            initial={false}
                            animate={{
                              width: `${((currentImageIndex + 1) / totalImages) * 100}%`,
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        </div>
                        {/* Counter text */}
                        <span className="text-[10px] sm:text-[11px] font-semibold text-white tabular-nums">
                          {currentImageIndex + 1}/{totalImages}
                        </span>
                      </div>
                    </div>

                    {/* Auto-slide progress indicator (shows when not hovered) */}
                    {!isHovered && (
                      <motion.div
                        className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="h-full bg-white/80"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: AUTO_SLIDE_INTERVAL / 1000,
                            ease: "linear",
                            repeat: Infinity,
                          }}
                          key={currentImageIndex}
                        />
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
            {/* Service Type + Subcategories */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <div className="flex items-center gap-1 text-[10px] sm:text-[12px] font-semibold text-[var(--hm-brand-500)]">
                <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="truncate">{getCategoryLabel()}</span>
              </div>
              {item.subcategories && item.subcategories.length > 0 && (
                <>
                  <span className="text-[var(--hm-n-300)] text-[10px]">·</span>
                  {item.subcategories.slice(0, 2).map((sub) => (
                    <span key={sub} className="text-[9px] sm:text-[10px] font-medium text-[var(--hm-fg-muted)] bg-[var(--hm-bg-tertiary)] px-1.5 py-0.5 rounded-full">
                      {getCategoryLabelStatic(sub, locale)}
                    </span>
                  ))}
                  {item.subcategories.length > 2 && (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--hm-brand-500)]">
                      +{item.subcategories.length - 2}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Title Row */}
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <div className="relative min-w-0 flex-1">
                <h3 className="font-semibold text-[13px] sm:text-base text-[var(--hm-fg-primary)] leading-tight line-clamp-2 group-hover:text-[var(--hm-brand-500)] transition-colors duration-300">
                  {svcNameMap[item.title?.toLowerCase().replace(/[\s-]+/g, '_')] || svcNameMap[item.category || ''] || item.title}
                </h3>
                {/* Animated underline - desktop only */}
                <span className="hidden sm:block absolute -bottom-0.5 left-0 w-0 h-[2px] bg-gradient-to-r from-[var(--hm-brand-500)] via-[#F06B43] to-[var(--hm-brand-500)] group-hover:w-full transition-all duration-500 ease-out rounded-full" />
              </div>

              {/* Rating or New badge */}
              {item.pro.rating && item.pro.rating > 0 ? (
                <StarRating
                  rating={item.pro.rating}
                  size="xs"
                  starColor={ACCENT_COLOR}
                  className="flex-shrink-0 [&>span]:!text-[var(--hm-brand-500)]"
                />
              ) : isNew ? (
                <StatusPill
                  variant="new"
                  size="xs"
                  locale={locale as "en" | "ka" | "ru"}
                />
              ) : null}
            </div>

            {/* Description or Bio - hidden on mobile, max 2 lines on desktop */}
            {(item.description || item.pro.bio) && (
              <p className="hidden sm:line-clamp-2 text-sm text-[var(--hm-fg-muted)] mb-4 leading-relaxed">
                {item.description || item.pro.bio}
              </p>
            )}

            {/* Bottom Row - Avatar + Name */}
            <div className="flex items-center mt-auto">
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 group/pro">
                {/* Avatar with hover ring */}
                <div className="relative">
                  <Avatar
                    src={item.pro.avatar}
                    name={item.pro.name}
                    size="xs"
                    className="w-5 h-5 sm:w-7 sm:h-7"
                  />
                  <div className="hidden sm:block absolute -inset-0.5 rounded-full border-2 border-transparent group-hover/pro:border-[var(--hm-brand-500)]/30 transition-all duration-300" />
                </div>
                {/* Name with hover color */}
                <span className="text-[11px] sm:text-sm font-medium text-[var(--hm-fg-secondary)] truncate group-hover/pro:text-[var(--hm-brand-500)] transition-colors duration-300">
                  {item.pro.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Ribbon */}
        {isPremium && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 z-20"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-[1.5px] sm:border-2 border-white">
              <Star
                className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white"
                fill="currentColor"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </Link>
  );
});

export default FeedCard;
