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
}

const getPropertyTypeLabel = (type?: string, locale: string = 'ka'): string => {
  const labels: Record<string, { en: string; ka: string }> = {
    apartment: { en: "Apartment", ka: "ბინა" },
    house: { en: "House", ka: "სახლი" },
    office: { en: "Office", ka: "ოფისი" },
    building: { en: "Building", ka: "შენობა" },
    other: { en: "Other", ka: "სხვა" },
  };
  if (!type) return "";
  const label = labels[type];
  return label ? label[locale as 'en' | 'ka'] : type;
};

const getCategoryLabel = (category?: string, locale: string = 'ka'): string => {
  const labels: Record<string, { en: string; ka: string }> = {
    renovation: { en: "Renovation", ka: "რემონტი" },
    plumbing: { en: "Plumbing", ka: "სანტექნიკა" },
    electrical: { en: "Electrical", ka: "ელექტრობა" },
    painting: { en: "Painting", ka: "მალიარობა" },
    flooring: { en: "Flooring", ka: "იატაკი" },
    roofing: { en: "Roofing", ka: "სახურავი" },
    hvac: { en: "HVAC", ka: "გათბობა/გაგრილება" },
    cleaning: { en: "Cleaning", ka: "დალაგება" },
    landscaping: { en: "Landscaping", ka: "ლანდშაფტი" },
    moving: { en: "Moving", ka: "გადაზიდვა" },
    furniture: { en: "Furniture", ka: "ავეჯი" },
    appliances: { en: "Appliances", ka: "ტექნიკა" },
    windows: { en: "Windows", ka: "ფანჯრები" },
    doors: { en: "Doors", ka: "კარები" },
    security: { en: "Security", ka: "უსაფრთხოება" },
    "interior-design": { en: "Interior Design", ka: "ინტერიერი" },
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
}: JobCardProps) {
  const { locale } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
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
      const updateCountdown = () => {
        const deadline = new Date(job.deadline!);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft(locale === 'ka' ? "დასრულდა" : "Expired");
          setDaysLeft(0);
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        setDaysLeft(days + (hours > 0 ? hours / 24 : 0));

        if (days > 0) {
          setTimeLeft(`${days}${locale === 'ka' ? 'დ' : 'd'} ${hours}${locale === 'ka' ? 'სთ' : 'h'}`);
        } else {
          setTimeLeft(`${hours}${locale === 'ka' ? 'სთ' : 'h'}`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [job.createdAt, job.deadline, locale]);

  const formatBudget = () => {
    if (job.budgetType === "fixed" && job.budgetAmount) {
      return `${job.budgetAmount.toLocaleString()}₾`;
    } else if (job.budgetType === "per_sqm" && job.pricePerUnit) {
      const total = job.areaSize ? job.pricePerUnit * job.areaSize : null;
      if (total) return `${total.toLocaleString()}₾`;
      return `${job.pricePerUnit}₾/მ²`;
    } else if (job.budgetType === "range" && job.budgetMin && job.budgetMax) {
      return `${job.budgetMin.toLocaleString()} - ${job.budgetMax.toLocaleString()}₾`;
    }
    return locale === 'ka' ? "შეთანხმებით" : "Negotiable";
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return locale === 'ka' ? "ახლა" : "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} ${locale === 'ka' ? 'წთ' : 'm'}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${locale === 'ka' ? 'სთ' : 'h'}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ${locale === 'ka' ? 'დღე' : 'd'}`;
    return new Date(date).toLocaleDateString(locale === 'ka' ? "ka-GE" : "en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const truncateLocation = (loc: string) => {
    if (!loc) return "";
    const parts = loc.split(",");
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]?.trim()}`;
    }
    return loc.length > 20 ? loc.substring(0, 20) + "..." : loc;
  };

  const isUrgent = daysLeft !== null && daysLeft <= 2 && daysLeft > 0;
  const isExpired = daysLeft === 0;

  const metaItems: string[] = [];
  if (job.propertyType) metaItems.push(getPropertyTypeLabel(job.propertyType, locale));
  if (job.areaSize) metaItems.push(`${job.areaSize} მ²`);
  if (job.roomCount) metaItems.push(`${job.roomCount} ${locale === 'ka' ? 'ოთახი' : 'rooms'}`);

  // Default variant - Full cinematic card with image background
  return (
    <Link
      href={`/jobs/${job._id}`}
      className="group block relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Urgent glow effect */}
      {isUrgent && (
        <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-60 blur-sm animate-pulse" />
      )}

      {/* Main Card Container - Solid dark background */}
      <div
        className={`
          relative overflow-hidden rounded-[20px]
          transition-all duration-500 ease-out
          group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]
          ${isExpired ? 'opacity-60' : ''}
        `}
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {/* Image Section - 3:4 aspect like FeedCard */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* Background Image */}
          {allImages.length > 0 && !imageError ? (
            <img
              src={getImageSrc(allImages[currentImageIndex])}
              alt={job.title}
              className={`
                w-full h-full object-cover
                transition-all duration-[1.2s] ease-out
                group-hover:scale-110
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E07B4F]/20 via-neutral-900 to-neutral-800 flex items-center justify-center">
              <svg className="w-20 h-20 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            </div>
          )}

          {/* Loading shimmer */}
          {!imageLoaded && !imageError && allImages.length > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 animate-pulse" />
          )}

          {/* Cinematic gradient overlay - stronger at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Top badges row */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-20">
            {/* Left side - Category + Status */}
            <div className="flex flex-col gap-2">
              {/* Category badge */}
              {job.category && (
                <div className="px-3 py-1.5 rounded-full bg-[#E07B4F] shadow-lg w-fit">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                    {getCategoryLabel(job.category, locale)}
                  </span>
                </div>
              )}

              {/* Status badges */}
              <div className="flex items-center gap-2">
                {isNew && (
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm shadow-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                      {locale === 'ka' ? 'ახალი' : 'New'}
                    </span>
                  </div>
                )}
                {isUrgent && !isExpired && (
                  <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                      {locale === 'ka' ? 'სასწრაფო' : 'Urgent'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Budget */}
            <div className="px-4 py-2 rounded-full bg-white shadow-lg">
              <span className="text-sm font-bold text-[#0a0a0a]">{formatBudget()}</span>
            </div>
          </div>

          {/* Save button - top right area */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave?.(job._id);
            }}
            className={`
              absolute top-20 right-4 z-20
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-300
              ${isSaved
                ? 'bg-[#E07B4F] text-white shadow-[0_0_20px_rgba(224,123,79,0.5)]'
                : 'bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 hover:text-white border border-white/10'
              }
            `}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isSaved ? 'scale-110' : ''}`}
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </button>

          {/* Image navigation for multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className={`
                  absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                  bg-black/50 backdrop-blur-md border border-white/10
                  flex items-center justify-center text-white
                  transition-all duration-300 z-20
                  ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                  hover:bg-black/70 hover:scale-110
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className={`
                  absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                  bg-black/50 backdrop-blur-md border border-white/10
                  flex items-center justify-center text-white
                  transition-all duration-300 z-20
                  ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
                  hover:bg-black/70 hover:scale-110
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Image dots indicator */}
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {allImages.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentImageIndex
                        ? 'bg-white w-4 h-1.5'
                        : 'bg-white/40 w-1.5 h-1.5 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Bottom Content Overlay - on top of image */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            {/* Title */}
            <h3 className="text-white font-semibold text-base leading-tight line-clamp-2 mb-2 group-hover:text-[#E07B4F] transition-colors">
              {job.title}
            </h3>

            {/* Description */}
            <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-3">
              {job.description || (locale === 'ka' ? "დეტალური აღწერა იხილეთ განცხადებაში" : "See details in the listing")}
            </p>

            {/* Meta row */}
            {metaItems.length > 0 && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {metaItems.map((item, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium">
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Client Info Bar */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              {/* Client avatar with animated border */}
              <div className="relative">
                <div className={`
                  absolute -inset-[2px] rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500
                  transition-opacity duration-300
                  ${isHovered ? 'opacity-100' : 'opacity-0'}
                `} />
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-neutral-800">
                  {job.clientId?.avatar ? (
                    <img src={job.clientId.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-[#E07B4F]/50 to-neutral-800">
                      {job.clientId?.name?.charAt(0) || 'C'}
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Location */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {job.clientId?.name || (locale === 'ka' ? 'კლიენტი' : 'Client')}
                </p>
                <p className="text-white/50 text-xs flex items-center gap-1 truncate">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {truncateLocation(job.location)}
                </p>
              </div>

              {/* Proposals badge */}
              {job.proposalCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                  <svg className="w-3 h-3 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <span className="text-white text-[11px] font-semibold">{job.proposalCount}</span>
                </div>
              )}

              {/* Time ago */}
              <span className="text-white/30 text-xs flex-shrink-0">
                {getTimeAgo(job.createdAt)}
              </span>
            </div>

            {/* Deadline bar - if exists */}
            {job.deadline && timeLeft && (
              <div className={`
                mt-3 px-3 py-2 rounded-lg flex items-center justify-center gap-2
                ${isExpired
                  ? "bg-red-500/20 border border-red-500/30"
                  : isUrgent
                    ? "bg-orange-500/20 border border-orange-500/30"
                    : "bg-white/5 border border-white/10"
                }
              `}>
                <svg
                  className={`w-3.5 h-3.5 ${
                    isExpired ? "text-red-400" : isUrgent ? "text-orange-400" : "text-white/50"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`text-xs font-medium ${
                  isExpired ? "text-red-400" : isUrgent ? "text-orange-400" : "text-white/50"
                }`}>
                  {isExpired
                    ? (locale === 'ka' ? "ვადა ამოიწურა" : "Deadline passed")
                    : `${locale === 'ka' ? 'დარჩა' : 'Left'}: ${timeLeft}`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Hover reveal arrow */}
          <div className={`
            absolute bottom-4 right-4 w-10 h-10 rounded-full
            bg-white flex items-center justify-center
            transition-all duration-500 ease-out z-20
            ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
          `}>
            <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
