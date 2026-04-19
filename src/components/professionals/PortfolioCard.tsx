'use client';

import { Badge } from '@/components/ui/badge';
import BeforeAfterSlider from '@/components/ui/BeforeAfterSlider';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { storage } from '@/services/storage';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryLabelStatic } from '@/hooks/useCategoryLabels';
import { Camera, Eye, MapPin, Sparkles, Star } from 'lucide-react';
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from 'react';
export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  location?: string;
  images: string[];
  videos?: string[];
  beforeAfter?: { before: string; after: string }[];
  date?: string;
  rating?: number;
  isVerified?: boolean;
  isEditable?: boolean;
  source?: 'external' | 'homico';
  clientName?: string;
  clientAvatar?: string;
  clientId?: string;
  review?: string;
  category?: string;
  completedDate?: string;
  projectType?: string;
}

export interface PortfolioCardProps {
  /** Project data */
  project: PortfolioProject;
  /** Click handler to open lightbox */
  onClick?: (imageIndex?: number) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

export default function PortfolioCard({
  project,
  onClick,
  locale = 'en',
  className = '',
}: PortfolioCardProps) {
  const [activeThumb, setActiveThumb] = useState(0);

  const { t } = useLanguage();
  const { categories } = useCategories();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Build service name lookup from catalog
  const svcLabel = useMemo(() => {
    if (!project.category) return '';
    for (const cat of categories) {
      if (cat.key === project.category) return locale === 'ka' ? cat.nameKa : cat.name;
      for (const sub of cat.subcategories || []) {
        if (sub.key === project.category) return locale === 'ka' ? sub.nameKa : sub.name;
        for (const svc of sub.services || []) {
          if (svc.key === project.category) return locale === 'ka' ? svc.nameKa : svc.name;
        }
      }
    }
    return getCategoryLabelStatic(project.category, locale);
  }, [project.category, categories, locale]);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D tilt tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 350, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 25 });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, 80]), springConfig);
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, 80]), springConfig);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)`
  );

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    glareOpacity.set(1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    glareOpacity.set(0);
  }

  // Regular images separate from before/after pairs
  const regularImages = project.images || [];
  const baPairs = project.beforeAfter || [];
  // allImages = regular images only (B/A shown differently)
  const allImages = [...regularImages];
  // Track B/A start index for thumbnail strip
  const baStartIndex = regularImages.length;
  // Add B/A "slots" to allImages for indexing (hero will show B/A split for these)
  baPairs.forEach(() => allImages.push("__ba__"));

  const hasBeforeAfter = baPairs.length > 0;

  const hasImages = allImages.length > 0;
  const currentImage = allImages[activeThumb] || allImages[0];
  const currentIsBa = activeThumb >= baStartIndex;
  const currentBaPair = currentIsBa ? baPairs[activeThumb - baStartIndex] : null;
  // Prefer optimized (Cloudinary) URLs when available; otherwise falls back to original URL.
  const currentSrc = currentImage
    ? storage.getOptimizedImageUrl(currentImage, "portfolio")
    : "";

  useEffect(() => {
    setImageLoaded(false);
  }, [currentImage]);

  if (!hasImages) return null;

  return (
    <motion.div
      ref={cardRef}
      className={`group relative bg-[var(--hm-bg-elevated)] rounded-2xl overflow-hidden cursor-pointer ${className}`}
    >
      {/* 3D Glare/shine overlay */}
      <motion.div
        className="absolute inset-0 z-40 pointer-events-none rounded-2xl"
        style={{
          opacity: glareOpacity,
          background: glareBackground,
        }}
      />

      {/* Card inner container */}
      <div className="relative bg-[var(--hm-bg-elevated)] rounded-2xl overflow-hidden border border-neutral-100/80 group-hover:border-[var(--hm-brand-500)]/30 transition-all duration-300">

        {/* Main Image */}
        {currentIsBa && currentBaPair ? (
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <BeforeAfterSlider
              beforeImage={storage.getOptimizedImageUrl(currentBaPair.before, "hero")}
              afterImage={storage.getOptimizedImageUrl(currentBaPair.after, "hero")}
              sizes="(max-width: 640px) 100vw, 400px"
              className="h-full"
              aspectRatio=""
            />
            {/* Top badges — pointer-events-none so they don't block drag */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-start justify-between z-20 pointer-events-none">
              {project.isVerified && (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-[var(--hm-success-500)]/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide shadow-lg">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  <span>{t('common.verified')}</span>
                </div>
              )}
              {allImages.length > 1 && (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium shadow-lg ml-auto">
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{allImages.length}{hasBeforeAfter && ' ✦'}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => onClick?.(activeThumb)}
            className="relative w-full aspect-[4/3] overflow-hidden"
          >
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-bg-tertiary)] to-[var(--hm-border)] animate-pulse" />
            )}

            <Image
              src={currentSrc}
              alt={project.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={60}
              className={`object-cover transition-all duration-700 group-hover:scale-[1.06] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoadingComplete={() => setImageLoaded(true)}
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top badges row */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-start justify-between z-20">
              {project.isVerified && (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-[var(--hm-success-500)]/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide shadow-lg">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  <span>{t('common.verified')}</span>
                </div>
              )}
              {allImages.length > 1 && (
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium shadow-lg ml-auto">
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{allImages.length}{hasBeforeAfter && ' ✦'}</span>
                </div>
              )}
            </div>

            {/* View button on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
              <div className="px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-400 ease-out flex items-center gap-2.5 hover:bg-[var(--hm-brand-500)] hover:text-white group/btn">
                <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                <span className="text-sm font-semibold">
                  {t('common.view')}
                </span>
              </div>
            </div>

            {/* Bottom info on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-400 ease-out">
                <h3 className="font-bold text-white text-lg drop-shadow-lg line-clamp-1">
                  {svcLabel || project.title}
                </h3>
                {project.location && (
                  <div className="flex items-center gap-1.5 mt-1 text-white/80 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    <MapPin className="w-3 h-3" />
                    <span>{project.location}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        )}

        {/* Thumbnail Strip */}
        {allImages.length > 1 && (
          <div className="flex gap-1.5 p-2.5 bg-gradient-to-b from-neutral-50/80 to-white border-t border-neutral-100/50">
            {allImages.slice(0, 4).map((img, imgIdx) => {
              const isBaPair = imgIdx >= baStartIndex;
              const baIdx = imgIdx - baStartIndex;
              const baPair = isBaPair ? baPairs[baIdx] : null;

              return (
                <button
                  key={imgIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveThumb(imgIdx);
                  }}
                  onMouseEnter={() => setActiveThumb(imgIdx)}
                  className={`relative flex-1 aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
                    activeThumb === imgIdx
                      ? 'ring-2 ring-[var(--hm-brand-500)] scale-[1.04] shadow-md'
                      : 'ring-1 ring-neutral-200/50 hover:ring-[var(--hm-brand-500)]/50 hover:scale-[1.02]'
                  }`}
                >
                  {baPair ? (
                    /* Before/After split thumbnail */
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 h-full relative">
                        <Image src={storage.getOptimizedImageUrl(baPair.before, "portfolioThumb")} alt="" fill sizes="150px" quality={80} loading="lazy" className="object-cover" />
                      </div>
                      <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--hm-bg-elevated)] z-10" />
                      <div className="w-1/2 h-full relative">
                        <Image src={storage.getOptimizedImageUrl(baPair.after, "portfolioThumb")} alt="" fill sizes="150px" quality={80} loading="lazy" className="object-cover" />
                      </div>
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-black/60 text-[7px] font-bold text-white z-10">
                        B/A
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={storage.getOptimizedImageUrl(img, "thumbnailSmall")}
                      alt=""
                      fill
                      sizes="96px"
                      quality={30}
                      loading="lazy"
                      fetchPriority="low"
                      className="object-cover"
                    />
                  )}
                  {activeThumb === imgIdx && (
                    <motion.div
                      layoutId={`thumb-indicator-${project.id}`}
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--hm-brand-500)]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {imgIdx === 3 && allImages.length > 4 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-brand-500)]/85 to-[#A85B44]/95 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="text-white text-sm font-bold">
                        +{allImages.length - 4}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Project Info Section */}
        <div className="p-4 pt-3">
          <h3 className="font-semibold text-[var(--hm-fg-primary)] text-base line-clamp-1 group-hover:text-[var(--hm-brand-500)] transition-colors duration-300">
            {svcLabel || project.title}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-[var(--hm-fg-muted)] line-clamp-2 mt-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Review quote */}
          {project.review && (
            <p className="text-xs text-[var(--hm-fg-muted)] italic mt-2 line-clamp-2 leading-relaxed">
              &ldquo;{project.review}&rdquo;
            </p>
          )}

          {/* Bottom row - Client + Rating + Source */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--hm-border-subtle)]">
            {/* Client info */}
            {project.clientName ? (
              <Link
                href={project.clientId ? `/professionals/${project.clientId}` : '#'}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 min-w-0 hover:text-[var(--hm-brand-500)] transition-colors"
              >
                {project.clientAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={storage.getOptimizedImageUrl(project.clientAvatar, 'avatar')} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[var(--hm-n-200)] flex items-center justify-center text-[8px] font-bold text-[var(--hm-fg-muted)]">
                    {project.clientName.charAt(0)}
                  </div>
                )}
                <span className="text-[11px] text-[var(--hm-fg-muted)] truncate hover:underline">{project.clientName}</span>
              </Link>
            ) : project.location ? (
              <div className="flex items-center gap-1.5 text-xs text-[var(--hm-fg-muted)]">
                <MapPin className="w-3 h-3" />
                <span>{project.location}</span>
              </div>
            ) : <div />}

            <div className="flex items-center gap-2 shrink-0">
              {project.source === 'homico' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--hm-success-50)]/20 text-[var(--hm-success-500)] font-medium">
                  ✓ Homico
                </span>
              )}
              {project.rating && project.rating > 0 && (
                <div className="flex items-center gap-0.5 text-xs">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-[var(--hm-fg-secondary)]">{project.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export interface EmptyPortfolioProps {
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

export function EmptyPortfolio({ locale = 'en', className = '' }: EmptyPortfolioProps) {
  const { t } = useLanguage();
  return (
    <div className={`text-center py-20 ${className}`}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative inline-block"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--hm-bg-tertiary)] to-[var(--hm-border)] flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Camera className="w-8 h-8 text-[var(--hm-fg-muted)]" />
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--hm-brand-500)]/10 flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3 text-[var(--hm-brand-500)]" />
        </motion.div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[var(--hm-fg-muted)] font-medium"
      >
        {t('professional.noPortfolioItemsYet')}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-[var(--hm-fg-muted)] text-sm mt-1"
      >
        {t('professional.projectsWillAppearHere')}
      </motion.p>
    </div>
  );
}
