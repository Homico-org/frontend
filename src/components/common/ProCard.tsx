"use client";

import { Badge } from "@/components/ui/badge";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { StarRating } from "@/components/ui/StarRating";
import { StatusPill } from "@/components/ui/StatusPill";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { storage } from "@/services/storage";
import { ProProfile, ProStatus } from "@/types";
import { Briefcase, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Play, Sparkles, Wallet, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/hooks/useTracker";

interface ProCardProps {
  profile: ProProfile;
  variant?: "default" | "compact" | "horizontal";
  /** Active browse filters — used to show relevant price/experience */
  activeCategory?: string;
  activeSubcategories?: string[];
  onLike?: () => void;
  showLikeButton?: boolean;
}

export default function ProCard({
  profile,
  variant = "default",
  activeCategory,
  activeSubcategories = [],
}: ProCardProps) {
  const { t, locale } = useLanguage();
  const { getCategoryLabel } = useCategoryLabels();
  const { categories: catalogCategories, getSubcategoriesForCategory } = useCategories();
  const [imageError, setImageError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Services and categories
  const { userCategories, userSubcategories, servicesWithExperience } = useMemo(() => {
    const selectedServices = profile.selectedServices as Array<{
      key: string;
      name: string;
      nameKa: string;
      categoryKey: string;
      experience: string;
    }> | undefined;

    if (selectedServices && selectedServices.length > 0) {
      const categories = [...new Set(selectedServices.map(s => s.categoryKey))];
      const subcategories = selectedServices.map(s => s.key);
      return { userCategories: categories, userSubcategories: subcategories, servicesWithExperience: selectedServices };
    }

    const categories = (profile.selectedCategories?.length ? profile.selectedCategories : profile.categories) || [];
    const subcategories = (profile.selectedSubcategories?.length ? profile.selectedSubcategories : profile.subcategories) || [];
    return { userCategories: categories, userSubcategories: subcategories, servicesWithExperience: null };
  }, [profile.selectedServices, profile.selectedCategories, profile.categories, profile.selectedSubcategories, profile.subcategories]);

  const getSubcatsForCategory = useMemo(() => (categoryKey: string) => {
    if (servicesWithExperience) {
      return servicesWithExperience.filter(s => s.categoryKey === categoryKey).map(s => s.key);
    }
    const categorySubcats = getSubcategoriesForCategory(categoryKey);
    const categorySubcatKeys = categorySubcats.map(s => s.key);
    return userSubcategories.filter(subKey => categorySubcatKeys.includes(subKey));
  }, [getSubcategoriesForCategory, userSubcategories, servicesWithExperience]);

  const isPremium = profile.isPremium || false;

  const avatarUrl = profile.avatar ? storage.getFileUrl(profile.avatar) : null;

  // Completed jobs count
  const portfolioCount = profile.portfolioProjects?.length || 0;
  const portfolioItemCount = profile.portfolioItemCount || 0;
  const externalJobs = profile.externalCompletedJobs || 0;
  const completedProjects = profile.completedProjects || 0;
  const completedJobsCounter = profile.completedJobs || 0;
  const completedJobs = Math.max(completedJobsCounter, portfolioCount, portfolioItemCount, completedProjects, externalJobs);

  // Filter-aware pricing: show price only for the filtered service(s)
  const matchedPricing = useMemo(() => {
    const sp = profile.servicePricing;
    if (!sp || sp.length === 0) return null;

    // If user filtered by specific subcategories, find matching service prices
    if (activeSubcategories.length > 0) {
      const matched = sp.filter(s => s.isActive && activeSubcategories.includes(s.serviceKey));
      if (matched.length === 1) return { value: `${matched[0].price}₾` };
      if (matched.length > 1) {
        const min = Math.min(...matched.map(s => s.price));
        const max = Math.max(...matched.map(s => s.price));
        return min === max ? { value: `${min}₾` } : { value: `${min}₾ - ${max}₾` };
      }
    }

    // If user filtered by category, show price range for that category
    if (activeCategory) {
      const catServices = sp.filter(s => s.isActive && s.categoryKey === activeCategory);
      if (catServices.length === 1) return { value: `${catServices[0].price}₾` };
      if (catServices.length > 1) {
        const min = Math.min(...catServices.map(s => s.price));
        const max = Math.max(...catServices.map(s => s.price));
        return min === max ? { value: `${min}₾` } : { value: `${min}₾ - ${max}₾` };
      }
    }

    // No filter — don't show a misleading aggregate price
    return null;
  }, [profile.servicePricing, activeCategory, activeSubcategories]);

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

    // No filter — don't show misleading aggregate
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

  // Track card visibility — only auto-slide when in viewport
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

  const isTopRated = profile.avgRating >= 4.8 && (profile.completedProjects || 0) >= 5;

  // Online/active status based on lastLoginAt
  const isOnline = useMemo(() => {
    if (!profile.lastLoginAt) return false;
    const diff = Date.now() - new Date(profile.lastLoginAt).getTime();
    return diff < 1000 * 60 * 30; // within 30 minutes
  }, [profile.lastLoginAt]);

  const handleClick = useCallback(() => {
    trackEvent('pro_click', profile.id, profile.name);
    // Save scroll position for back navigation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('browseScrollY', window.scrollY.toString());
    }
  }, [profile.id, profile.name]);

  // Build catalog lookup: key → localized name (covers categories, subcategories, services)
  const catalogLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of catalogCategories) {
      map.set(cat.key, locale === 'ka' ? cat.nameKa : cat.name);
      for (const sub of cat.subcategories) {
        map.set(sub.key, locale === 'ka' ? sub.nameKa : sub.name);
        for (const svc of (sub.services || [])) {
          map.set(svc.key, locale === 'ka' ? svc.nameKa : svc.name);
        }
      }
    }
    return map;
  }, [catalogCategories, locale]);

  // All subcategories for display — filtered against current catalog
  const allSubcats = useMemo(() => {
    const raw = userCategories.flatMap(cat => getSubcatsForCategory(cat));
    return raw.filter(key => catalogLabelMap.has(key));
  }, [userCategories, getSubcatsForCategory, catalogLabelMap]);

  const displaySubcats = allSubcats.slice(0, 3);
  const remainingSubcats = allSubcats.length - 3;

  if (variant === "horizontal") {
    // Keep horizontal variant simple — used in recommendations etc.
    return (
      <Link href={`/professionals/${profile.id}`} className="group block h-full" onClick={handleClick}>
        <div className="relative h-full bg-[var(--hm-bg-elevated)] rounded-xl overflow-hidden border border-[var(--hm-border-subtle)] shadow-sm group-hover:border-[var(--hm-brand-500)]/25 transition-all duration-300 group-hover:shadow-md p-3.5">
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
                  <StarRating rating={profile.avgRating > 0 ? profile.avgRating : 5.0} reviewCount={profile.totalReviews} showCount size="xs" />
                ) : (
                  <StatusPill variant="new" size="xs" locale={locale} />
                )}
                {matchedExperience && (
                  <>
                    <span className="text-[var(--hm-n-300)]">·</span>
                    <span>{matchedExperience}</span>
                  </>
                )}
                {matchedPricing && (
                  <>
                    <span className="text-[var(--hm-n-300)]">·</span>
                    <span className="text-[var(--hm-brand-500)] font-medium">{matchedPricing.value}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default / Compact variant — unified card with portfolio photos
  return (
    <Link ref={cardRef} href={`/professionals/${profile.id}`} className="group block h-full" onClick={handleClick} aria-label={`${profile.name} — ${t('browse.professionals')}`}>
      <div className={`relative h-full flex flex-col bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)] shadow-sm group-hover:border-[var(--hm-brand-500)]/25 transition-all duration-300 group-hover:shadow-lg ${isPremium ? 'ring-1 ring-amber-300/30' : ''}`}>

        {/* Portfolio media carousel */}
        {mediaSlides.length > 0 ? (
          <div
            className="relative aspect-[4/3] bg-[var(--hm-bg-tertiary)] overflow-hidden"
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
              return (
                <Image
                  src={storage.getOptimizedImageUrl(slide.src, { width: 500, quality: 70 })}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
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
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--hm-bg-page)] to-[var(--hm-bg-tertiary)] flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-5 h-5 text-[var(--hm-n-300)] mx-auto mb-1" />
              <span className="text-[10px] text-[var(--hm-fg-muted)]">{t('professional.noPortfolioItemsYet')}</span>
            </div>
          </div>
        )}

        {/* Avatar overlapping carousel bottom */}
        <div className="relative -mt-6 ml-3 sm:ml-4 mb-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--hm-bg-tertiary)] ring-3 ring-white shadow-md relative">
            {avatarUrl && !imageError ? (
              <Image
                src={avatarUrl}
                alt={profile.name}
                fill
                sizes="48px"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base font-bold text-[var(--hm-fg-muted)]">
                {profile.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="flex-1 flex flex-col px-3 sm:px-4 pb-3 sm:pb-4 pt-1.5">
          {/* Pro identity */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-[var(--hm-fg-primary)] truncate group-hover:text-[var(--hm-brand-500)] transition-colors">
                  {profile.name}
                </h3>
                {isOnline && (
                  <span className="w-2 h-2 rounded-full bg-[var(--hm-success-500)] shrink-0" title="Online" />
                )}
                {profile.verificationStatus === 'verified' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--hm-success-500)] flex-shrink-0" />
                )}
                {isTopRated && (
                  <span className="hidden sm:inline-flex">
                    <StatusPill variant="topRated" size="xs" locale={locale} label="Top" />
                  </span>
                )}
            </div>
            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-0.5">
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
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2 text-[11px] text-[var(--hm-fg-muted)] mb-2.5 flex-wrap">
            {matchedExperience && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {matchedExperience}
                </span>
                <span className="text-[var(--hm-n-300)]">·</span>
              </>
            )}
            <span className="flex items-center gap-1">
              {completedJobs} {t('professional.completedJobsCount')}
            </span>
            {matchedPricing && (
              <>
                <span className="text-[var(--hm-n-300)]">·</span>
                <span className="flex items-center gap-1 text-[var(--hm-brand-500)] font-semibold">
                  <Wallet className="w-3 h-3" />
                  {matchedPricing.value}
                </span>
              </>
            )}
            {profile.avgResponseTime != null && profile.avgResponseTime > 0 && profile.avgResponseTime <= 24 && (
              <>
                <span className="text-[var(--hm-n-300)]">·</span>
                <span className="flex items-center gap-1 text-[var(--hm-success-500)] font-medium">
                  <Zap className="w-3 h-3" />
                  {profile.avgResponseTime < 1
                    ? t('professional.lessThanHour')
                    : profile.avgResponseTime <= 4
                    ? t('professional.lessThanHours', { count: 4 })
                    : t('professional.lessThanHours', { count: 24 })}
                </span>
              </>
            )}
          </div>

          {/* Service pills */}
          <div className="flex flex-wrap gap-1 mt-auto">
            {displaySubcats.map((key) => (
              <span
                key={key}
                className="px-2 py-0.5 text-[10px] font-medium text-[var(--hm-fg-secondary)] bg-[var(--hm-bg-tertiary)] rounded-full"
              >
                {catalogLabelMap.get(key) || getCategoryLabel(key)}
              </span>
            ))}
            {remainingSubcats > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 rounded-full">
                +{remainingSubcats}
              </span>
            )}
          </div>
        </div>

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-2 right-2 z-10">
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
