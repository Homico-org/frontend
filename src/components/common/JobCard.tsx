"use client";

import { storage } from "@/services/storage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MediaItem {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: string;
  propertyType?: string;
  areaSize?: number;
  sizeUnit?: string;
  roomCount?: number;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  deadline?: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  images: string[];
  media: MediaItem[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  clientId: {
    _id: string;
    name: string;
    avatar?: string;
    city?: string;
    accountType?: "individual" | "organization";
    companyName?: string;
  };
}

interface JobCardProps {
  job: Job;
  variant?: "default" | "compact" | "list";
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
  hasApplied?: boolean;
}

const getCategoryLabel = (category?: string, locale: string = 'en'): string => {
  const labels: Record<string, { en: string; ka: string }> = {
    renovation: { en: "Renovation", ka: "რემონტი" },
    plumbing: { en: "Plumbing", ka: "სანტექნიკა" },
    electrical: { en: "Electrical", ka: "ელექტრობა" },
    painting: { en: "Painting", ka: "მალიარობა" },
    flooring: { en: "Flooring", ka: "იატაკი" },
    roofing: { en: "Roofing", ka: "სახურავი" },
    hvac: { en: "HVAC", ka: "გათბობა" },
    cleaning: { en: "Cleaning", ka: "დალაგება" },
    landscaping: { en: "Landscaping", ka: "ლანდშაფტი" },
    moving: { en: "Moving", ka: "გადაზიდვა" },
    furniture: { en: "Furniture", ka: "ავეჯი" },
    appliances: { en: "Appliances", ka: "ტექნიკა" },
    windows: { en: "Windows", ka: "ფანჯრები" },
    doors: { en: "Doors", ka: "კარები" },
    security: { en: "Security", ka: "უსაფრთხოება" },
    "interior-design": { en: "Interior", ka: "ინტერიერი" },
    architecture: { en: "Architecture", ka: "არქიტექტურა" },
    other: { en: "Other", ka: "სხვა" },
  };
  if (!category) return "";
  const label = labels[category];
  return label ? label[locale as 'en' | 'ka'] : category.replace(/-/g, ' ');
};

export default function JobCard({
  job,
  onSave,
  isSaved = false,
  hasApplied = false,
}: JobCardProps) {
  const { locale } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Combine media and images
  const mediaImages = Array.isArray(job.media)
    ? job.media.filter((m) => m.type === "image").map((m) => m.url)
    : [];
  const jobImages = Array.isArray(job.images) ? job.images : [];
  const allImages: string[] = [
    ...mediaImages,
    ...jobImages.filter((img) => !mediaImages.includes(img)),
  ];
  const hasMultipleImages = allImages.length > 1;

  const getImageSrc = (img: string) => {
    if (!img) return "";
    if (img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }
    return storage.getFileUrl(img);
  };

  const nextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const formatBudget = () => {
    if (job.budgetType === "fixed" && job.budgetAmount) {
      return `${job.budgetAmount.toLocaleString()}₾`;
    } else if (job.budgetType === "per_sqm" && job.pricePerUnit) {
      const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
      if (total) return `${total.toLocaleString()}₾`;
      return `${job.pricePerUnit}₾/მ²`;
    } else if (job.budgetType === "range" && job.budgetMin && job.budgetMax) {
      return `${job.budgetMin.toLocaleString()}-${job.budgetMax.toLocaleString()}₾`;
    }
    return locale === 'ka' ? "შეთანხმებით" : "Negotiable";
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${locale === 'ka' ? 'წთ' : 'm'}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${locale === 'ka' ? 'სთ' : 'h'}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${locale === 'ka' ? 'დ' : 'd'}`;
    return `${Math.floor(seconds / 604800)}${locale === 'ka' ? 'კვ' : 'w'}`;
  };

  const truncateLocation = (loc: string) => {
    if (!loc) return "";
    const parts = loc.split(",");
    return parts[0]?.trim() || loc.substring(0, 15);
  };

  const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft > 0;
  const isExpired = daysLeft === 0;

  return (
    <Link href={`/jobs/${job._id}`} className="group block">
      <div className={`bg-white dark:bg-neutral-900 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-neutral-100 dark:border-neutral-800 ${isExpired ? 'opacity-60' : ''}`}>

        {/* Image Section */}
        <div className="relative aspect-[16/10] bg-neutral-100 dark:bg-neutral-800">
          {allImages.length > 0 && !imageError ? (
            <img
              src={getImageSrc(allImages[currentImageIndex])}
              alt={job.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            </div>
          )}

          {/* Loading placeholder */}
          {!imageLoaded && !imageError && allImages.length > 0 && (
            <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          )}

          {/* Budget badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/95 dark:bg-black/70 rounded text-[13px] font-semibold text-neutral-900 dark:text-white shadow-sm">
            {formatBudget()}
          </div>

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isNew && !hasApplied && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500 text-white">
                {locale === 'ka' ? 'ახალი' : 'New'}
              </span>
            )}
            {isUrgent && !isExpired && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500 text-white">
                {locale === 'ka' ? 'სასწრაფო' : 'Urgent'}
              </span>
            )}
            {hasApplied && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500 text-white">
                {locale === 'ka' ? 'გაგზავნილი' : 'Applied'}
              </span>
            )}
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave?.(job._id);
            }}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-black/50 flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
          >
            <svg
              className={`w-5 h-5 transition-colors ${isSaved ? 'text-amber-500' : 'text-neutral-600 dark:text-neutral-300'}`}
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </button>

          {/* Image navigation */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
              >
                <svg className="w-4 h-4 text-neutral-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
              >
                <svg className="w-4 h-4 text-neutral-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.slice(0, 5).map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {getCategoryLabel(job.category, locale)}
            </span>
            <span className="text-[11px] text-neutral-400">
              {getTimeAgo(job.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[15px] text-neutral-900 dark:text-white leading-snug mb-1 line-clamp-2">
            {job.title}
          </h3>

          {/* Description */}
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
            {job.description || (locale === 'ka' ? "დეტალები იხილეთ განცხადებაში" : "See listing for details")}
          </p>

          {/* Divider */}
          <div className="h-px bg-neutral-100 dark:bg-neutral-800 mb-3" />

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            {/* Client info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                {job.clientId?.avatar ? (
                  <img src={job.clientId.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {job.clientId?.name?.charAt(0) || 'C'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">
                  {job.clientId?.name?.split(' ')[0] || (locale === 'ka' ? 'კლიენტი' : 'Client')}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {truncateLocation(job.location)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 flex-shrink-0 text-neutral-400">
              {job.proposalCount > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-[12px] font-medium">{job.proposalCount}</span>
                </div>
              )}
              {job.viewCount > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[12px] font-medium">{job.viewCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
