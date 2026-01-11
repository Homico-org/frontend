'use client';

import { Badge } from '@/components/ui/badge';
import { storage } from '@/services/storage';
import { Camera, Eye, MapPin, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  location?: string;
  images: string[];
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
  locale?: 'en' | 'ka';
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
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!project.images || project.images.length === 0) return null;

  const currentImage = project.images[activeThumb] || project.images[0];

  return (
    <div
      className={`group relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer ${className}`}
      style={{
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Premium border glow effect */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-[#C4735B]/0 via-[#C4735B]/0 to-[#C4735B]/0 group-hover:from-[#C4735B]/40 group-hover:via-[#D4937B]/20 group-hover:to-[#C4735B]/40 transition-all duration-700 opacity-0 group-hover:opacity-100 blur-[1px]" />
      
      {/* Card inner container */}
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100/80 dark:border-neutral-800 group-hover:border-[#C4735B]/20 transition-all duration-500">
        
        {/* Shine effect overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>

        {/* Decorative accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C4735B]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#C4735B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100 z-10 pointer-events-none" />
        
        {/* Main Image */}
        <button
          onClick={() => onClick?.(activeThumb)}
          className="relative w-full aspect-[4/3] overflow-hidden"
        >
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 animate-pulse" />
          )}
          
          <img
            src={storage.getFileUrl(currentImage)}
            alt={project.title}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top badges row */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-20">
            {/* Verified badge */}
            {project.isVerified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide shadow-lg">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{locale === 'ka' ? 'ვერიფიცირებული' : 'Verified'}</span>
              </div>
            )}
            
            {/* Image count badge */}
            {project.images.length > 1 && (
              <Badge 
                variant="ghost" 
                size="sm" 
                icon={<Camera className="w-3 h-3" />} 
                className="bg-black/40 backdrop-blur-md text-white border border-white/20 shadow-lg ml-auto"
              >
                {project.images.length}
              </Badge>
            )}
          </div>

          {/* View button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <div className="px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm shadow-2xl transform scale-90 group-hover:scale-100 transition-all duration-300 flex items-center gap-2.5 hover:bg-[#C4735B] hover:text-white group/btn">
              <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
              <span className="text-sm font-semibold">
                {locale === 'ka' ? 'ნახვა' : 'View'}
              </span>
            </div>
          </div>

          {/* Bottom info on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-bold text-white text-lg drop-shadow-lg line-clamp-1">
                {project.title}
              </h3>
              {project.location && (
                <div className="flex items-center gap-1.5 mt-1 text-white/80 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{project.location}</span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Thumbnail Strip - Premium Design */}
        {project.images.length > 1 && (
          <div className="flex gap-1.5 p-2.5 bg-gradient-to-b from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-900 border-t border-neutral-100/50 dark:border-neutral-800/50">
            {project.images.slice(0, 4).map((img, imgIdx) => (
              <button
                key={imgIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveThumb(imgIdx);
                }}
                onMouseEnter={() => setActiveThumb(imgIdx)}
                className={`relative flex-1 aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
                  activeThumb === imgIdx 
                    ? 'ring-2 ring-[#C4735B] scale-[1.02] shadow-md' 
                    : 'ring-1 ring-neutral-200/50 dark:ring-neutral-700/50 hover:ring-[#C4735B]/50 hover:scale-[1.02]'
                }`}
              >
                <img
                  src={storage.getFileUrl(img)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {/* Active indicator dot */}
                {activeThumb === imgIdx && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C4735B]" />
                )}
                {/* +N overlay on last thumbnail */}
                {imgIdx === 3 && project.images.length > 4 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B]/85 to-[#A85B44]/95 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white text-sm font-bold">
                      +{project.images.length - 4}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Project Info Section */}
        <div className="p-4 pt-3">
          {/* Title with animated underline */}
          <div className="relative inline-block max-w-full">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-base line-clamp-1 group-hover:text-[#C4735B] transition-colors duration-300">
              {project.title}
            </h3>
            {/* Animated underline - more visible */}
            <span className="absolute -bottom-0.5 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C4735B] via-[#D4937B] to-[#C4735B] group-hover:w-full transition-all duration-500 ease-out rounded-full shadow-sm shadow-[#C4735B]/30" />
          </div>
          
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
    </div>
  );
}

export interface EmptyPortfolioProps {
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
}

export function EmptyPortfolio({ locale = 'en', className = '' }: EmptyPortfolioProps) {
  return (
    <div className={`text-center py-20 ${className}`}>
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Camera className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#C4735B]/10 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-[#C4735B]" />
        </div>
      </div>
      <p className="text-neutral-500 dark:text-neutral-400 font-medium">
        {locale === 'ka' ? 'ნამუშევრები არ არის' : 'No portfolio items yet'}
      </p>
      <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">
        {locale === 'ka' ? 'პროექტები მალე გამოჩნდება' : 'Projects will appear here'}
      </p>
    </div>
  );
}
