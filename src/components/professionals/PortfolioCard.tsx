'use client';

import { Camera, ExternalLink, MapPin } from 'lucide-react';

const getImageUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (path.startsWith('/')) return `${apiUrl}${path}`;
  return `${apiUrl}/uploads/${path}`;
};

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  location?: string;
  images: string[];
  date?: string;
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
  if (!project.images || project.images.length === 0) return null;

  return (
    <div
      className={`group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-800 hover:shadow-xl hover:border-[#C4735B]/20 transition-all duration-300 ${className}`}
    >
      {/* Main Image */}
      <button
        onClick={() => onClick?.(0)}
        className="relative w-full aspect-[4/3] overflow-hidden"
      >
        <img
          src={getImageUrl(project.images[0])}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Image count badge */}
        {project.images.length > 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
            <Camera className="w-3 h-3" />
            {project.images.length}
          </div>
        )}

        {/* View button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="px-4 py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-neutral-800" />
            <span className="text-sm font-medium text-neutral-800">
              {locale === 'ka' ? 'ნახვა' : 'View'}
            </span>
          </div>
        </div>
      </button>

      {/* Thumbnail Strip - show if more than 1 image */}
      {project.images.length > 1 && (
        <div className="flex gap-1 p-2 bg-neutral-50 dark:bg-neutral-800/50">
          {project.images.slice(0, 4).map((img, imgIdx) => (
            <button
              key={imgIdx}
              onClick={() => onClick?.(imgIdx)}
              className="relative flex-1 aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-[#C4735B] transition-all"
            >
              <img
                src={getImageUrl(img)}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Show +N overlay on last thumbnail if more images */}
              {imgIdx === 3 && project.images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    +{project.images.length - 4}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Project Info */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white text-base mb-1 line-clamp-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {project.description}
          </p>
        )}
        {project.location && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-400">
            <MapPin className="w-3 h-3" />
            <span>{project.location}</span>
          </div>
        )}
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
    <div className={`text-center py-16 ${className}`}>
      <Camera className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
      <p className="text-neutral-500">
        {locale === 'ka' ? 'ნამუშევრები არ არის' : 'No portfolio items yet'}
      </p>
    </div>
  );
}
