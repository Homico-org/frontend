'use client';

import { Camera, MapPin } from 'lucide-react';
import { storage } from '@/services/storage';

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  location?: string;
  images: string[];
  videos?: string[];
}

export interface PortfolioTabProps {
  /** List of portfolio projects */
  projects: PortfolioProject[];
  /** Handler when a project is clicked */
  onProjectClick?: (project: { images: string[]; videos: string[]; title: string; currentIndex: number }) => void;
  /** Locale for translations */
  locale?: 'en' | 'ka';
}

export default function PortfolioTab({
  projects,
  onProjectClick,
  locale = 'en',
}: PortfolioTabProps) {
  if (projects.length === 0) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="text-center py-16">
          <Camera className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500">
            {locale === 'ka' ? 'ნამუშევრები არ არის' : 'No portfolio items yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-800 hover:shadow-xl hover:border-[#C4735B]/20 transition-all duration-300"
          >
            {/* Main Image or Video */}
            <button
              onClick={() =>
                onProjectClick?.({
                  images: project.images,
                  videos: project.videos || [],
                  title: project.title,
                  currentIndex: 0,
                })
              }
              className="relative w-full aspect-[4/3] overflow-hidden"
            >
              {project.images.length > 0 ? (
                <img
                  src={storage.getFileUrl(project.images[0])}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : project.videos && project.videos.length > 0 ? (
                <>
                  <video
                    src={storage.getFileUrl(project.videos[0])}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  {/* Play icon overlay for video */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/80 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : null}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Image/video count badge */}
              {(project.images.length > 1 || (project.videos && project.videos.length > 0)) && (
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {project.images.length > 1 && (
                    <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {project.images.length}
                    </div>
                  )}
                  {project.videos && project.videos.length > 0 && (
                    <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {project.videos.length}
                    </div>
                  )}
                </div>
              )}
            </button>

            {/* Thumbnail Strip - show if more than 1 image */}
            {project.images.length > 1 && (
              <div className="flex gap-1 p-2 bg-neutral-50 dark:bg-neutral-800/50">
                {project.images.slice(0, 4).map((img, imgIdx) => (
                  <button
                    key={imgIdx}
                    onClick={() =>
                      onProjectClick?.({
                        images: project.images,
                        videos: project.videos || [],
                        title: project.title,
                        currentIndex: imgIdx,
                      })
                    }
                    className="relative flex-1 aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-[#C4735B] transition-all"
                  >
                    <img
                      src={storage.getFileUrl(img)}
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
        ))}
      </div>
    </div>
  );
}

