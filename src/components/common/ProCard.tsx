"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { StarRating } from "@/components/ui/StarRating";
import { StatusPill } from "@/components/ui/StatusPill";
import ProBadges from "@/components/professionals/ProBadges";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { storage } from "@/services/storage";
import { ProProfile, ProStatus } from "@/types";
import { currencySymbol, formatCurrency, formatCurrencyRange } from "@/utils/currency";
import { translateCity } from "@/data/cities";
import { ArrowUpRight, Briefcase, CalendarPlus, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, ImageOff, MapPin, Play, Plus, Star, Wallet, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/hooks/useTracker";
import { getScrollParent } from "@/utils/scrollUtils";

interface ProCardProps {
  profile: ProProfile;
  variant?: "default" | "compact" | "horizontal";
  /** Active browse filters - used to show relevant price/experience */
  activeCategory?: string;
  activeSubcategories?: string[];
  onLike?: () => void;
  showLikeButton?: boolean;
  /**
   * When provided, renders a "Book" CTA on the card (default/compact variants)
   * so a user can book this pro straight from the service-filtered listing
   * instead of opening the full profile first. The parent owns the booking modal.
   */
  onBook?: (profile: ProProfile) => void;
}

export default function ProCard({
  profile,
  variant = "default",
  activeCategory,
  activeSubcategories = [],
  onBook,
}: ProCardProps) {
  const { t, locale, pick } = useLanguage();
  const { getCategoryLabel } = useCategoryLabels();
  const { categories: catalogCategories, getSubcategoriesForCategory } = useCategories();
  const [imageError, setImageError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  // Portfolio slides that failed to load. The carousel <Image> has no native
  // fallback, so a transient load failure would otherwise leave the browser's
  // broken-image glyph stuck with nothing behind it. Track per source URL and
  // swap to a neutral placeholder instead.
  const [failedSlideSrcs, setFailedSlideSrcs] = useState<Set<string>>(
    () => new Set(),
  );
  const [isHovered, setIsHovered] = useState(false);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Services and categories - derived in priority order:
  //   1. `servicePricing` (the structured source the pro detail page renders)
  //   2. `selectedServices` (mid-migration field with experience data)
  //   3. legacy `selectedCategories` / `selectedSubcategories` arrays
  //
  // Bug previously: when a pro cleared their servicePricing, the legacy
  // `selectedSubcategories` field stayed populated, so the listing card
  // showed stale services that the detail page (correctly) didn't.
  // Trusting an empty servicePricing array as "no services" fixes that -
  // we only fall through to legacy when servicePricing is undefined.
  const { userCategories, userSubcategories, servicesWithExperience } = useMemo(() => {
    const sp = profile.servicePricing;
    if (Array.isArray(sp)) {
      const active = sp.filter((s) => s.isActive);
      const categories = [...new Set(active.map((s) => s.categoryKey).filter(Boolean))];
      // Subcategory keys: dedupe, prefer subcategoryKey, fall back to serviceKey
      const subcategories = [
        ...new Set(active.map((s) => s.subcategoryKey || s.serviceKey).filter(Boolean)),
      ];
      return {
        userCategories: categories,
        userSubcategories: subcategories,
        servicesWithExperience: null,
      };
    }

    const selectedServices = profile.selectedServices as Array<{
      key: string;
      name: string;
      nameKa: string;
      categoryKey: string;
      experience: string;
    }> | undefined;

    if (selectedServices && selectedServices.length > 0) {
      const categories = [...new Set(selectedServices.map((s) => s.categoryKey))];
      const subcategories = [...new Set(selectedServices.map((s) => s.key))]; // deduped
      return {
        userCategories: categories,
        userSubcategories: subcategories,
        servicesWithExperience: selectedServices,
      };
    }

    const categories = (profile.selectedCategories?.length ? profile.selectedCategories : profile.categories) || [];
    const subcategories = (profile.selectedSubcategories?.length ? profile.selectedSubcategories : profile.subcategories) || [];
    // Dedup legacy arrays defensively (older data sometimes has duplicates)
    return {
      userCategories: [...new Set(categories)],
      userSubcategories: [...new Set(subcategories)],
      servicesWithExperience: null,
    };
  }, [profile.servicePricing, profile.selectedServices, profile.selectedCategories, profile.categories, profile.selectedSubcategories, profile.subcategories]);

  const getSubcatsForCategory = useMemo(() => (categoryKey: string) => {
    if (servicesWithExperience) {
      return servicesWithExperience.filter(s => s.categoryKey === categoryKey).map(s => s.key);
    }
    const categorySubcats = getSubcategoriesForCategory(categoryKey);
    const categorySubcatKeys = categorySubcats.map(s => s.key);
    return userSubcategories.filter(subKey => categorySubcatKeys.includes(subKey));
  }, [getSubcategoriesForCategory, userSubcategories, servicesWithExperience]);

  const isPremium = profile.isPremium || false;

  // Only offer the Book CTA when the pro has at least one active, priced
  // service - otherwise the booking modal's first step would be empty.
  const hasBookableServices = useMemo(
    () => (profile.servicePricing || []).some((s) => s.isActive && s.price > 0),
    [profile.servicePricing],
  );

  const avatarUrl = profile.avatar ? storage.getFileUrl(profile.avatar) : null;

  // Completed jobs count.
  const portfolioItemCount = profile.portfolioItemCount || 0;
  const externalJobs = profile.externalCompletedJobs || 0;
  const completedJobsCounter = profile.completedJobs || 0;
  // "Completed jobs" must mean actual jobs done — NOT portfolio size. Folding
  // portfolio counts in here made a pro with e.g. 10 portfolio photos and zero
  // jobs show "10 completed jobs", which is false. Count only real platform
  // jobs + the pro's declared off-platform jobs.
  const completedJobs = Math.max(completedJobsCounter, externalJobs);

  // Filter-aware pricing: show price only for the filtered service(s).
  // Range-aware - when an entry has `priceMin`/`priceMax`, use its bounds
  // instead of the midpoint `price` to show the customer the real range.
  const matchedPricing = useMemo(() => {
    const sp = profile.servicePricing;
    if (!sp || sp.length === 0) return null;

    // Extract the [lo, hi] bounds for a single servicePricing entry
    const bounds = (e: { price: number; priceMin?: number; priceMax?: number }): [number, number] => {
      const hasRange =
        e.priceMin !== undefined &&
        e.priceMax !== undefined &&
        e.priceMin > 0 &&
        e.priceMax > 0;
      if (hasRange) return [e.priceMin as number, e.priceMax as number];
      return [e.price, e.price];
    };

    // Combine a list of entries into one display string
    const combine = (entries: typeof sp): string => {
      let lo = Number.POSITIVE_INFINITY;
      let hi = Number.NEGATIVE_INFINITY;
      for (const e of entries) {
        const [l, h] = bounds(e);
        if (l > 0 && l < lo) lo = l;
        if (h > 0 && h > hi) hi = h;
      }
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return '';
      // Currency comes from the pro's marketplace - falls back to GE
      // when missing so legacy data stays formatted correctly.
      return lo === hi
        ? formatCurrency(lo, { country: profile.country ?? 'GE' })
        : formatCurrencyRange(lo, hi, { country: profile.country ?? 'GE' });
    };

    // If user filtered by specific subcategories, find matching service prices
    if (activeSubcategories.length > 0) {
      const matched = sp.filter(s => s.isActive && activeSubcategories.includes(s.serviceKey));
      const value = combine(matched);
      if (value) return { value };
    }

    // If user filtered by category, show price range for that category
    if (activeCategory) {
      const catServices = sp.filter(s => s.isActive && s.categoryKey === activeCategory);
      const value = combine(catServices);
      if (value) return { value };
    }

    // No filter - don't show a misleading aggregate price
    return null;
  }, [profile.servicePricing, activeCategory, activeSubcategories, profile.country]);

  // Filter-aware experience: show experience for the filtered service
  const matchedExperience = useMemo(() => {
    if (!servicesWithExperience || servicesWithExperience.length === 0) return null;
    const expToLabel: Record<string, string> = {
      '1-2': `1-2${t('timeUnits.year')}`,
      '3-5': `3-5${t('timeUnits.year')}`,
      '5-10': `5-10${t('timeUnits.year')}`,
      '10+': `10+${t('timeUnits.year')}`,
    };

    if (activeSubcategories.length > 0) {
      const matched = servicesWithExperience.filter(s => activeSubcategories.includes(s.key));
      if (matched.length > 0) {
        const expToYears: Record<string, number> = { '1-2': 2, '3-5': 5, '5-10': 10, '10+': 15 };
        const best = matched.reduce((a, b) => (expToYears[a.experience] || 0) >= (expToYears[b.experience] || 0) ? a : b);
        return expToLabel[best.experience] || null;
      }
    }

    if (activeCategory) {
      const catServices = servicesWithExperience.filter(s => s.categoryKey === activeCategory);
      if (catServices.length > 0) {
        const expToYears: Record<string, number> = { '1-2': 2, '3-5': 5, '5-10': 10, '10+': 15 };
        const best = catServices.reduce((a, b) => (expToYears[a.experience] || 0) >= (expToYears[b.experience] || 0) ? a : b);
        return expToLabel[best.experience] || null;
      }
    }

    // No filter - don't show misleading aggregate
    return null;
  }, [servicesWithExperience, activeCategory, activeSubcategories, t]);

  // All media slides: images, before/after pairs, videos
  type MediaSlide =
    | { type: 'image'; src: string }
    | { type: 'beforeAfter'; before: string; after: string }
    | { type: 'video'; src: string };

  const mediaSlides = useMemo<MediaSlide[]>(() => {
    const slides: MediaSlide[] = [];
    const images = profile.portfolioPreviewImages || [];
    const baPairs = profile.portfolioPreviewBeforeAfter || [];
    const videos = profile.portfolioPreviewVideos || [];

    // If no backend previews, fall back to embedded projects
    if (images.length === 0 && baPairs.length === 0 && videos.length === 0) {
      for (const project of (profile.portfolioProjects || [])) {
        for (const img of (project.images || [])) slides.push({ type: 'image', src: img });
        for (const ba of (project.beforeAfterPairs || [])) {
          slides.push({ type: 'beforeAfter', before: ba.beforeImage, after: ba.afterImage });
        }
      }
      return slides;
    }

    // Before/after pairs first (most interesting), then images, then videos
    for (const ba of baPairs) slides.push({ type: 'beforeAfter', before: ba.before, after: ba.after });
    for (const img of images) slides.push({ type: 'image', src: img });
    for (const vid of videos) slides.push({ type: 'video', src: vid });
    return slides;
  }, [profile.portfolioPreviewImages, profile.portfolioPreviewBeforeAfter, profile.portfolioPreviewVideos, profile.portfolioProjects]);

  const totalMediaCount = useMemo(() => {
    const previewImages = profile.portfolioPreviewImages?.length || 0;
    const previewBA = profile.portfolioPreviewBeforeAfter?.length || 0;
    const previewVid = profile.portfolioPreviewVideos?.length || 0;
    const total = previewImages + previewBA + previewVid;
    return Math.max(total, portfolioItemCount);
  }, [profile.portfolioPreviewImages, profile.portfolioPreviewBeforeAfter, profile.portfolioPreviewVideos, portfolioItemCount]);

  // Track card visibility - only auto-slide when in viewport
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setIsInView(e.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-advance slides every 4s, pause on hover or when offscreen
  useEffect(() => {
    if (isHovered || !isInView || mediaSlides.length <= 1) {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
      return;
    }
    autoSlideRef.current = setInterval(() => {
      setActiveSlide((p) => (p + 1) % mediaSlides.length);
    }, 4000);
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [isHovered, isInView, mediaSlides.length]);

  // Match the canonical Top-Rated rule (deriveProBadges): rating + review
  // volume. `completedProjects` was the wrong field - it's usually undefined,
  // so the badge never showed even for clearly top-rated pros.
  const isTopRated =
    profile.avgRating >= 4.8 && (profile.totalReviews || 0) >= 5;

  // Online/active status based on lastLoginAt
  const isOnline = useMemo(() => {
    if (!profile.lastLoginAt) return false;
    const diff = Date.now() - new Date(profile.lastLoginAt).getTime();
    return diff < 1000 * 60 * 30; // within 30 minutes
  }, [profile.lastLoginAt]);

  // Tooltip text for the online status dot. Was silent decoration
  // before - now reads as concrete proof of recent activity.
  const lastSeenLabel = useMemo(() => {
    if (!profile.lastLoginAt) return null;
    const diffMin = Math.floor((Date.now() - new Date(profile.lastLoginAt).getTime()) / 60000);
    if (diffMin < 5) return t('professional.activeNow');
    if (diffMin < 60) return t('professional.lastSeenMinutes', { count: diffMin });
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return t('professional.lastSeenHours', { count: diffH });
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return t('professional.lastSeenDays', { count: diffD });
    return null;
  }, [profile.lastLoginAt, t]);

  // "Member since" subtitle - tells clients whether the pro is brand
  // new or established on the platform. Uses createdAt which the API
  // populates on every user record.
  const memberSinceLabel = useMemo(() => {
    if (!profile.createdAt) return null;
    const monthsAgo = Math.floor(
      (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    if (monthsAgo < 1) return t('professional.memberSinceWeeks');
    if (monthsAgo < 12) return t('professional.memberSinceMonths', { count: monthsAgo });
    const years = Math.floor(monthsAgo / 12);
    return t('professional.memberSinceYears', { count: years });
  }, [profile.createdAt, t]);

  // Response-time pill text. Previously the Zap icon was silent when
  // avgResponseTime was missing or > 24h - clients couldn't tell if
  // that meant "slow" or "no data". Now we ALWAYS show the data we
  // have (or skip when truly missing), but pick a green-positive
  // bucket for fast responders.
  const responseTimeLabel = useMemo(() => {
    const t1 = profile.avgResponseTime;
    if (t1 == null || !Number.isFinite(t1) || t1 <= 0) return null;
    if (t1 < 1) return { text: t('professional.repliesWithinHour'), isFast: true };
    if (t1 <= 4) return { text: t('professional.repliesWithinHours', { count: 4 }), isFast: true };
    if (t1 <= 24) return { text: t('professional.repliesWithinHours', { count: 24 }), isFast: false };
    return null;
  }, [profile.avgResponseTime, t]);

  // Tooltip on the star rating - turns the number into a verification claim.
  const ratingTooltip = useMemo(() => {
    if (!profile.totalReviews || profile.totalReviews <= 0) return undefined;
    return t('professional.verifiedReviewsTooltip', {
      count: profile.totalReviews,
    });
  }, [profile.totalReviews, t]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent('pro_click', profile.id, profile.name);
    // Save scroll position for back navigation. The browse shell scrolls
    // inside an overflow-y-auto <main>, not the window - window.scrollY
    // is always 0 there, so read the real scroll container instead.
    if (typeof window !== 'undefined') {
      const scrollParent = getScrollParent(e.currentTarget);
      const y = scrollParent ? scrollParent.scrollTop : window.scrollY;
      sessionStorage.setItem('browseScrollY', y.toString());
    }
  }, [profile.id, profile.name]);

  // Build catalog lookup: key → localized name (covers categories, subcategories, services)
  const catalogLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of catalogCategories) {
      map.set(cat.key, pick({ en: cat.name, ka: cat.nameKa }));
      for (const sub of cat.subcategories) {
        map.set(sub.key, pick({ en: sub.name, ka: sub.nameKa }));
        for (const svc of (sub.services || [])) {
          map.set(svc.key, pick({ en: svc.name, ka: svc.nameKa }));
        }
      }
    }
    return map;
  }, [catalogCategories, pick]);

  // All subcategories for display - filtered against current catalog
  const allSubcats = useMemo(() => {
    const raw = userCategories.flatMap(cat => getSubcatsForCategory(cat));
    return raw.filter(key => catalogLabelMap.has(key));
  }, [userCategories, getSubcatsForCategory, catalogLabelMap]);

  // Bumped from 3 → 4 since the new pills wrap cleanly and don't truncate.
  const displaySubcats = allSubcats.slice(0, 4);
  const remainingSubcats = allSubcats.length - 4;

  // Min-price per subcategory key - used to surface a "from N₾" hint next
  // to each service pill so clients can scan price at a glance. Built from
  // `servicePricing` (the structured source); falls back to nothing when
  // the pro hasn't entered structured prices yet.
  const subcatMinPrice = useMemo(() => {
    const map = new Map<string, number>();
    const sp = profile.servicePricing;
    if (!Array.isArray(sp)) return map;
    for (const entry of sp) {
      if (!entry.isActive) continue;
      // When the pro set a range, the floor is `priceMin`; otherwise fall back
      // to the single `price`. Either way we want the smallest meaningful
      // number to drive the "from N₾" copy on the browse card.
      const floor =
        entry.priceMin !== undefined && entry.priceMin > 0
          ? entry.priceMin
          : typeof entry.price === "number" && entry.price > 0
            ? entry.price
            : undefined;
      if (floor === undefined) continue;
      // Index by both subcategoryKey and serviceKey so whichever key the
      // pill renders with, the lookup hits.
      for (const key of [entry.subcategoryKey, entry.serviceKey]) {
        if (!key) continue;
        const existing = map.get(key);
        if (existing === undefined || floor < existing) {
          map.set(key, floor);
        }
      }
    }
    return map;
  }, [profile.servicePricing]);

  if (variant === "horizontal") {
    // Keep horizontal variant simple - used in recommendations etc.
    return (
      <Link href={`/${(profile.country ?? 'GE').toLowerCase()}/professionals/${profile.id}`} className="group block h-full" onClick={handleClick}>
        <div
          className="relative h-full bg-[var(--hm-bg-elevated)] rounded-xl overflow-hidden border border-[var(--hm-border-subtle)] group-hover:border-[var(--hm-brand-500)]/25 transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-lg p-3.5"
          style={{
            boxShadow:
              "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--hm-bg-tertiary)] ring-2 ring-white shadow-md">
                {avatarUrl && !imageError ? (
                  <Image src={avatarUrl} alt={profile.name} fill sizes="56px" className="object-cover" onError={() => setImageError(true)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[var(--hm-fg-muted)]">{profile.name.charAt(0)}</div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-semibold text-[13px] text-[var(--hm-fg-primary)] truncate group-hover:text-[var(--hm-brand-500)] transition-colors">{profile.name}</h3>
                {profile.verificationStatus === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--hm-success-500)] flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--hm-fg-muted)]">
                {(profile.totalReviews || 0) > 0 ? (
                  <span title={ratingTooltip}>
                    <StarRating rating={profile.avgRating > 0 ? profile.avgRating : 5.0} reviewCount={profile.totalReviews} showCount size="xs" />
                  </span>
                ) : (
                  <StatusPill variant="new" size="xs" locale={locale} />
                )}
                {matchedExperience && (
                  <>
                    <span className="text-[var(--hm-fg-muted)]">·</span>
                    <span>{matchedExperience}</span>
                  </>
                )}
                {matchedPricing && (
                  <>
                    <span className="text-[var(--hm-fg-muted)]">·</span>
                    <span className="text-[var(--hm-brand-500)] font-medium">{matchedPricing.value}</span>
                  </>
                )}
              </div>
              {memberSinceLabel && (
                <p className="mt-0.5 text-[10px] text-[var(--hm-fg-muted)] truncate">
                  {memberSinceLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default / Compact variant - unified card with portfolio photos
  const hasMedia = mediaSlides.length > 0;
  return (
    <Link ref={cardRef} href={`/${(profile.country ?? 'GE').toLowerCase()}/professionals/${profile.id}`} className="group block h-full" onClick={handleClick} aria-label={`${profile.name} - ${t('browse.professionals')}`}>
      <div
        className={`relative h-full flex flex-col bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)] group-hover:border-[var(--hm-brand-500)]/30 transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-[2px] ${isPremium ? 'ring-1 ring-amber-300/30' : ''}`}
        style={{
          boxShadow:
            "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        }}
      >

        {/* Portfolio media carousel - wide-and-short aspect so the photo
            doesn't dominate the card. */}
        {hasMedia ? (
          <div
            className="relative aspect-[2/1] bg-[var(--hm-bg-tertiary)] overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Current slide */}
            {(() => {
              const slide = mediaSlides[activeSlide] || mediaSlides[0];
              if (!slide) return null;
              if (slide.type === 'beforeAfter') {
                return (
                  <BeforeAfterSlider
                    beforeImage={storage.getOptimizedImageUrl(slide.before, { width: 400, quality: 70 })}
                    afterImage={storage.getOptimizedImageUrl(slide.after, { width: 400, quality: 70 })}
                    className="absolute inset-0 h-full"
                    aspectRatio=""
                    handleSize="sm"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                );
              }
              if (slide.type === 'video') {
                return (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <video src={slide.src} className="w-full h-full object-cover" muted preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 text-[var(--hm-fg-secondary)] ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              }
              if (failedSlideSrcs.has(slide.src)) {
                return (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--hm-bg-tertiary)]">
                    <ImageOff className="w-6 h-6 text-[var(--hm-fg-muted)]" />
                  </div>
                );
              }
              return (
                <Image
                  src={storage.getOptimizedImageUrl(slide.src, { width: 500, quality: 70 })}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={() =>
                    setFailedSlideSrcs((prev) => {
                      const next = new Set(prev);
                      next.add(slide.src);
                      return next;
                    })
                  }
                />
              );
            })()}

            {/* Slide nav arrows */}
            {mediaSlides.length > 1 && (
              <>
                <button
                  aria-label="Previous image"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSlide((p) => (p - 1 + mediaSlides.length) % mediaSlides.length); }}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                >
                  <ChevronLeft className="w-4 h-4 text-[var(--hm-fg-secondary)]" />
                </button>
                <button
                  aria-label="Next image"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSlide((p) => (p + 1) % mediaSlides.length); }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                >
                  <ChevronRight className="w-4 h-4 text-[var(--hm-fg-secondary)]" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {mediaSlides.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {mediaSlides.slice(0, 6).map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveSlide(i); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${activeSlide === i ? 'bg-[var(--hm-bg-elevated)] w-3' : 'bg-white/50'}`}
                  />
                ))}
                {mediaSlides.length > 6 && (
                  <span className="text-[8px] text-white/70 font-medium self-center ml-0.5">+{mediaSlides.length - 6}</span>
                )}
              </div>
            )}

            {/* Count badge */}
            {totalMediaCount > 1 && (
              <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 z-10">
                <Camera className="w-3 h-3" />
                {totalMediaCount}
              </span>
            )}
          </div>
        ) : (
          // No portfolio: thin neutral band acting as a clean spacer for the
          // overlapping avatar below. Uses `--hm-bg-tertiary` (theme-aware) so
          // it shows as off-white in light mode and a subtle elevated dark in
          // dark mode - previously hardcoded `--hm-n-50` rendered as bright
          // white in both modes, creating a "white strip on a dark card" look.
          <div
            aria-hidden
            className="relative h-7 sm:h-8"
            style={{
              backgroundColor: 'var(--hm-bg-tertiary)',
              borderBottom: '1px solid var(--hm-border-subtle)',
            }}
          />
        )}

        {/* Avatar overlap. Larger when there's no media (it becomes the card's
            visual anchor). Smaller when overlapping a photo. */}
        <div className={`relative ${hasMedia ? '-mt-5 ml-3' : '-mt-5 ml-3'} mb-0`}>
          <div className={`${hasMedia ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-12 h-12 sm:w-14 sm:h-14'} rounded-full overflow-hidden bg-[var(--hm-bg-tertiary)] ring-[3px] ring-[var(--hm-bg-elevated)] shadow-sm relative transition-all`}>
            {avatarUrl && !imageError ? (
              <Image
                src={avatarUrl}
                alt={profile.name}
                fill
                sizes="56px"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-bold text-[var(--hm-fg-muted)] ${hasMedia ? 'text-xs' : 'text-lg'}`}>
                {profile.name.charAt(0)}
              </div>
            )}
            {isOnline && (
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--hm-success-500)] ring-2 ring-[var(--hm-bg-elevated)]"
                title={lastSeenLabel || t('professional.activeNow')}
              />
            )}
          </div>
        </div>

        {/* Card body - comfortable padding */}
        <div className="flex-1 flex flex-col px-3 pb-3 pt-1.5 sm:px-3.5 sm:pb-3.5">
          {/* Pro identity */}
          <div className="mb-1.5">
            <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-[14px] sm:text-[15px] text-[var(--hm-fg-primary)] truncate group-hover:text-[var(--hm-brand-500)] transition-colors leading-tight">
                  {profile.name}
                </h3>
                {profile.verificationStatus === 'verified' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--hm-success-500)] flex-shrink-0" />
                )}
                {isTopRated && (
                  <span className="hidden sm:inline-flex">
                    <StatusPill variant="topRated" size="xs" locale={locale} />
                  </span>
                )}
                {/* Away pill - pro toggled themselves Away in settings.
                    Profile still visible but signal to clients that
                    response time will be slower. Hidden on mobile to
                    keep the card header tight. */}
                {profile.status === 'away' && (
                  <span className="hidden sm:inline-flex">
                    <StatusPill variant="away" size="xs" locale={locale} />
                  </span>
                )}
            </div>
            {/* Rating + city - co-located with subtle separator. Rating
                wrapper carries a tooltip so the number reads as
                verified-on-Homico rather than scraped from somewhere. */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--hm-fg-muted)]">
              {(profile.totalReviews || 0) > 0 ? (
                <span title={ratingTooltip}>
                  <StarRating
                    rating={profile.avgRating > 0 ? profile.avgRating : 5.0}
                    reviewCount={profile.totalReviews}
                    showCount
                    size="xs"
                  />
                </span>
              ) : (
                <Badge variant="success" size="xs" icon={<Plus className="w-2.5 h-2.5" />}>
                  {t('card.new')}
                </Badge>
              )}
              {profile.city && (
                <>
                  <span className="opacity-50">·</span>
                  <span className="inline-flex items-center gap-0.5 truncate max-w-[100px]">
                    <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{translateCity(profile.city, locale)}</span>
                  </span>
                </>
              )}
            </div>
            {/* Member-since line. Tells clients whether this pro is
                established on Homico or brand new. Renders only when
                we have a createdAt date. */}
            {memberSinceLabel && (
              <p className="mt-0.5 text-[10px] text-[var(--hm-fg-muted)] truncate">
                {memberSinceLabel}
              </p>
            )}
            {/* Trust badges - verified/topRated already render in the header
                row above, so exclude them here to avoid doubling up. */}
            <ProBadges
              pro={profile}
              locale={locale}
              size="xs"
              max={6}
              exclude={["verified", "topRated"]}
              tooltip={false}
              className="mt-1.5"
            />
          </div>

          {/* Stats row. Separators are LEADING (shown only when something
              precedes), so any item can be absent — e.g. completed-jobs is
              hidden at 0 — without leaving a dangling "·". */}
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--hm-fg-muted)] mb-2 flex-wrap">
            {matchedExperience && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {matchedExperience}
              </span>
            )}
            {completedJobs > 0 && (
              <>
                {matchedExperience && (
                  <span className="text-[var(--hm-fg-muted)]">·</span>
                )}
                <span className="flex items-center gap-1">
                  {completedJobs} {t('professional.completedJobsCount')}
                </span>
              </>
            )}
            {matchedPricing && (
              <>
                {(matchedExperience || completedJobs > 0) && (
                  <span className="text-[var(--hm-fg-muted)]">·</span>
                )}
                <span className="flex items-center gap-1 text-[var(--hm-brand-500)] font-semibold">
                  <Wallet className="w-3 h-3" />
                  {matchedPricing.value}
                </span>
              </>
            )}
            {responseTimeLabel && (
              <>
                {(matchedExperience || completedJobs > 0 || matchedPricing) && (
                  <span className="text-[var(--hm-fg-muted)]">·</span>
                )}
                <span
                  className={`flex items-center gap-1 font-medium ${
                    responseTimeLabel.isFast
                      ? 'text-[var(--hm-success-500)]'
                      : 'text-[var(--hm-fg-secondary)]'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {responseTimeLabel.text}
                </span>
              </>
            )}
          </div>

          {/* Service pills - clean, no gray fill, no truncation. The label can
              wrap to a second line when needed; "from N₾" sits to the right
              tinted in vermillion so the price reads as the value, not the
              service name. */}
          <div className="flex flex-wrap gap-1.5">
            {displaySubcats.map((key) => {
              const label = catalogLabelMap.get(key) || getCategoryLabel(key);
              const price = subcatMinPrice.get(key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[11px] font-medium leading-tight"
                  style={{
                    border: '1px solid var(--hm-border-subtle)',
                    color: 'var(--hm-fg-primary)',
                    background: 'transparent',
                  }}
                >
                  <span>{label}</span>
                  {price !== undefined && (
                    <span
                      className="font-semibold"
                      style={{ color: 'var(--hm-brand-500)' }}
                    >
                      {(() => {
                        const sym = currencySymbol({ country: profile.country ?? 'GE' });
                        return pick({
                          en: `from ${price}${sym}`,
                          ka: `${price}${sym}-დან`,
                          ru: `от ${price}${sym}`,
                        });
                      })()}
                    </span>
                  )}
                </span>
              );
            })}
            {remainingSubcats > 0 && (
              <span
                className="inline-flex items-center px-2.5 py-[5px] rounded-full text-[11px] font-semibold"
                style={{
                  color: 'var(--hm-brand-500)',
                  border: '1px solid rgba(239,78,36,0.20)',
                  background: 'transparent',
                }}
              >
                +{remainingSubcats}
              </span>
            )}
          </div>

          {/* Book CTA - only when the parent wired a booking handler and the
              pro has bookable services. Stops the click from following the
              card's wrapping <Link> to the profile page. */}
          {onBook && hasBookableServices && profile.isHomicoPartner && (
            <Button
              variant="default"
              size="sm"
              className="w-full mt-2.5"
              leftIcon={<CalendarPlus className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBook(profile);
              }}
            >
              {t("booking.book")}
            </Button>
          )}
        </div>

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white">
              <Star className="w-3 h-3 text-white fill-current" />
            </div>
          </div>
        )}

        {/* Hover-reveal "open" affordance - sits over the bottom-right
            corner. Hidden until hover so it doesn't compete with the card
            content at rest. Suppressed when the Book CTA is shown, otherwise
            the two collide on the bottom-right on hover. */}
        {!(onBook && hasBookableServices && profile.isHomicoPartner) && (
          <div
            aria-hidden
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[var(--hm-brand-500)] flex items-center justify-center shadow-md opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>
    </Link>
  );
}
