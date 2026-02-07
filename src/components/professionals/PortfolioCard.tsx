'use client';

import { Badge } from '@/components/ui/badge';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { storage } from '@/services/storage';
import { Camera, Eye, MapPin, Sparkles, Star } from 'lucide-react';
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';

import { useLanguage } from "@/contexts/LanguageContext";
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
  /** Whether this project can be edited/deleted by owner (false for Homico-generated projects) */
  isEditable?: boolean;
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
  const [imageLoaded, setImageLoaded] = useState(false);
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

  // Combine all images including before/after pairs for display
  const allImages = [
    ...(project.images || []),
    // Add 'after' images from before/after pairs (they're usually more visually appealing)
    ...(project.beforeAfter || []).map(pair => pair.after),
  ];

  const hasBeforeAfter = project.beforeAfter && project.beforeAfter.length > 0;

  const hasImages = allImages.length > 0;
  const currentImage = allImages[activeThumb] || allImages[0];
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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { duration: 0.2, ease: "easeOut" } }}
      className={`group relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden cursor-pointer ${className}`}
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
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100/80 dark:border-neutral-800 group-hover:border-[#C4735B]/30 transition-all duration-300">

        {/* Main Image */}
        <button
          onClick={() => onClick?.(activeThumb)}
          className="relative w-full aspect-[4/3] overflow-hidden"
        >
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 animate-pulse" />
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
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-20">
            {/* Verified badge */}
            {project.isVerified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide shadow-lg">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{t('common.verified')}</span>
              </div>
            )}

            {/* Image count badge */}
            {allImages.length > 1 && (
              <Badge
                variant="ghost"
                size="sm"
                icon={<Camera className="w-3 h-3" />}
                className="bg-black/40 backdrop-blur-md text-white border border-white/20 shadow-lg ml-auto"
              >
                {allImages.length}
                {hasBeforeAfter && ' ✦'}
              </Badge>
            )}
          </div>

          {/* View button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <div className="px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm shadow-2xl transform scale-75 group-hover:scale-100 transition-all duration-400 ease-out flex items-center gap-2.5 hover:bg-[#C4735B] hover:text-white group/btn">
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
                {project.title}
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

        {/* Thumbnail Strip */}
        {allImages.length > 1 && (
          <div className="flex gap-1.5 p-2.5 bg-gradient-to-b from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-900 border-t border-neutral-100/50 dark:border-neutral-800/50">
            {allImages.slice(0, 4).map((img, imgIdx) => (
              <button
                key={imgIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveThumb(imgIdx);
                }}
                onMouseEnter={() => setActiveThumb(imgIdx)}
                className={`relative flex-1 aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
                  activeThumb === imgIdx
                    ? 'ring-2 ring-[#C4735B] scale-[1.04] shadow-md'
                    : 'ring-1 ring-neutral-200/50 dark:ring-neutral-700/50 hover:ring-[#C4735B]/50 hover:scale-[1.02]'
                }`}
              >
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
                {/* Active indicator dot */}
                {activeThumb === imgIdx && (
                  <motion.div
                    layoutId={`thumb-indicator-${project.id}`}
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C4735B]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                {/* +N overlay on last thumbnail */}
                {imgIdx === 3 && allImages.length > 4 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B]/85 to-[#A85B44]/95 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white text-sm font-bold">
                      +{allImages.length - 4}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Project Info Section */}
        <div className="p-4 pt-3">
          <h3 className="font-semibold text-neutral-900 dark:text-white text-base line-clamp-1 group-hover:text-[#C4735B] transition-colors duration-300">
            {project.title}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Bottom row - Location & Rating */}
          <div className="flex items-center justify-between mt-3">
            {project.location && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 group-hover:text-[#C4735B]/70 transition-colors duration-300">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-medium">{project.location}</span>
              </div>
            )}

            {project.rating && project.rating > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{project.rating.toFixed(1)}</span>
              </div>
            )}
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
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Camera className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#C4735B]/10 flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3 text-[#C4735B]" />
        </motion.div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-neutral-500 dark:text-neutral-400 font-medium"
      >
        {t('professional.noPortfolioItemsYet')}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-neutral-400 dark:text-neutral-500 text-sm mt-1"
      >
        {t('professional.projectsWillAppearHere')}
      </motion.p>
    </div>
  );
}
