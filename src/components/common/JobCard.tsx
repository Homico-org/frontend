"use client";

import { storage } from "@/services/storage";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
    other: { en: "Other", ka: "სხვა" },
  };
  if (!category) return "";
  const label = labels[category];
  return label ? label[locale as 'en' | 'ka'] : category;
};

// Cinematic Image Slider Component
function ImageSlider({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goToNext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % images.length);
    },
    [images.length]
  );

  const goToPrev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    },
    [images.length]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < images.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  // Placeholder when no images
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
        <svg
          className="w-16 h-16 text-neutral-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
    );
  }

  const getImageSrc = (img: string) => {
    if (!img) return "";
    if (img.startsWith("http://") || img.startsWith("https://")) {
      return img;
    }
    return storage.getFileUrl(img);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Images */}
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="w-full h-full flex-shrink-0 min-w-full relative group/img"
          >
            {!imageError[idx] ? (
              <>
                <img
                  src={getImageSrc(img)}
                  alt=""
                  className={`
                    w-full h-full object-cover
                    transition-all duration-[1.2s] ease-out
                    group-hover:scale-110
                    ${imageLoaded[idx] ? 'opacity-100' : 'opacity-0'}
                  `}
                  loading={idx === 0 ? "eager" : "lazy"}
                  onLoad={() => setImageLoaded((prev) => ({ ...prev, [idx]: true }))}
                  onError={() => setImageError((prev) => ({ ...prev, [idx]: true }))}
                />
                {/* Loading shimmer */}
                {!imageLoaded[idx] && (
                  <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 animate-pulse" />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                <svg
                  className="w-12 h-12 text-neutral-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80 pointer-events-none" />

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
              bg-black/50 backdrop-blur-md border border-white/10
              flex items-center justify-center text-white
              transition-all duration-300 z-10
              ${isHovering ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
              hover:bg-black/70 hover:scale-110
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
              bg-black/50 backdrop-blur-md border border-white/10
              flex items-center justify-center text-white
              transition-all duration-300 z-10
              ${isHovering ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}
              hover:bg-black/70 hover:scale-110
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && images.length <= 5 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`
                transition-all duration-300 rounded-full
                ${idx === currentIndex
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }
              `}
            />
          ))}
        </div>
      )}

      {/* Image counter badge */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium z-10">
          {currentIndex + 1}/{images.length}
        </div>
      )}
    </div>
  );
}

export default function JobCard({
  job,
  variant = "default",
  onSave,
  isSaved = false,
}: JobCardProps) {
  const { locale } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
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
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setDaysLeft(days + (hours > 0 ? hours / 24 : 0));

        if (days > 0) {
          setTimeLeft(`${days}${locale === 'ka' ? 'დ' : 'd'} ${hours}${locale === 'ka' ? 'სთ' : 'h'}`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}${locale === 'ka' ? 'სთ' : 'h'} ${minutes}${locale === 'ka' ? 'წთ' : 'm'}`);
        } else {
          setTimeLeft(`${minutes}${locale === 'ka' ? 'წთ' : 'm'}`);
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

  // Compact variant - Minimal cinematic style
  if (variant === "compact") {
    return (
      <Link
        href={`/jobs/${job._id}`}
        className="group block relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[16px] bg-[#0a0a0a] transition-all duration-500 ease-out group-hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
          {/* Image section */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <ImageSlider images={allImages} />

            {/* Budget badge */}
            <div className="absolute top-3 right-3 z-20">
              <div className="px-3 py-1.5 rounded-full bg-white shadow-lg">
                <span className="text-sm font-bold text-[#0a0a0a]">{formatBudget()}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-2 group-hover:text-[#E07B4F] transition-colors">
              {job.title}
            </h3>
            <p className="text-white/40 text-xs flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {truncateLocation(job.location)}
            </p>
          </div>

          {/* Hover gradient accent */}
          <div className={`
            absolute bottom-0 left-0 right-0 h-[2px]
            bg-gradient-to-r from-[#E07B4F] via-[#E8956A] to-[#E07B4F]
            transition-transform duration-500 origin-left
            ${isHovered ? 'scale-x-100' : 'scale-x-0'}
          `} />
        </div>
      </Link>
    );
  }

  // List variant - Horizontal cinematic style
  if (variant === "list") {
    return (
      <Link
        href={`/jobs/${job._id}`}
        className="group block relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[16px] bg-[#0a0a0a] transition-all duration-500 ease-out group-hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 p-4">
            {/* Client avatar */}
            <div className="relative flex-shrink-0">
              <div className={`
                absolute -inset-[2px] rounded-xl bg-gradient-to-r from-[#E07B4F] to-[#E8956A]
                transition-opacity duration-300
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `} />
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800">
                {job.clientId?.avatar ? (
                  <img src={job.clientId.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E07B4F]/30 to-neutral-800">
                    <span className="text-lg font-bold text-white/40">
                      {job.clientId?.name?.charAt(0) || "C"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-white truncate group-hover:text-[#E07B4F] transition-colors">
                {job.title}
              </h3>
              <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {truncateLocation(job.location)} · {getTimeAgo(job.createdAt)}
              </p>
            </div>

            {/* Budget */}
            <div className="flex-shrink-0">
              <span className="font-bold text-sm text-[#E07B4F]">{formatBudget()}</span>
            </div>

            {/* Arrow */}
            <div className={`
              w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0
              transition-all duration-500 ease-out
              ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
            `}>
              <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Bottom accent */}
          <div className={`
            absolute bottom-0 left-0 right-0 h-[2px]
            bg-gradient-to-r from-[#E07B4F] via-[#E8956A] to-[#E07B4F]
            transition-transform duration-500 origin-left
            ${isHovered ? 'scale-x-100' : 'scale-x-0'}
          `} />
        </div>
      </Link>
    );
  }

  // Default variant - Full cinematic card
  return (
    <Link
      href={`/jobs/${job._id}`}
      className="group block relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Urgent glow effect */}
      {isUrgent && (
        <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-70 blur-sm animate-pulse" />
      )}

      <div className={`
        relative overflow-hidden rounded-[20px] bg-[#0a0a0a]
        transition-all duration-500 ease-out
        group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]
        ${isExpired ? 'opacity-60' : ''}
      `}>
        {/* Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <ImageSlider images={allImages} />

          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none z-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Top row badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            {/* Category badge */}
            {job.category && (
              <div className="px-3 py-1.5 rounded-full bg-[#E07B4F] shadow-lg">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                  {getCategoryLabel(job.category, locale)}
                </span>
              </div>
            )}

            {/* Budget badge */}
            <div className="px-4 py-2 rounded-full bg-white shadow-lg">
              <span className="text-sm font-bold text-[#0a0a0a]">{formatBudget()}</span>
            </div>
          </div>

          {/* Status badges */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {isNew && (
              <div className="px-3 py-1 rounded-full bg-emerald-500 shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {locale === 'ka' ? 'ახალი' : 'New'}
                </span>
              </div>
            )}
            {isUrgent && !isExpired && (
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg flex items-center gap-1.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {locale === 'ka' ? 'სასწრაფო' : 'Urgent'}
                </span>
              </div>
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
            className={`
              absolute bottom-20 right-4 z-20
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
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Title and time */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-white font-semibold text-base leading-tight line-clamp-2 group-hover:text-[#E07B4F] transition-colors flex-1">
              {job.title}
            </h3>
            <span className="text-white/30 text-xs flex-shrink-0 mt-1">
              {getTimeAgo(job.createdAt)}
            </span>
          </div>

          {/* Description */}
          <p className="text-white/40 text-sm leading-relaxed line-clamp-2 mb-4">
            {job.description || (locale === 'ka' ? "დეტალური აღწერა იხილეთ განცხადებაში" : "See details in the listing")}
          </p>

          {/* Meta row */}
          {metaItems.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              {metaItems.map((item, i) => (
                <span key={i} className="text-white/50 text-xs flex items-center gap-1">
                  {i > 0 && <span className="text-white/20 mx-1">·</span>}
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* Proposals badge */}
          {job.proposalCount > 0 && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E07B4F]/10 text-[#E07B4F] text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                {job.proposalCount} {locale === 'ka' ? 'შეთავაზება' : 'proposals'}
              </span>
            </div>
          )}

          {/* Footer - Client info */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              {/* Client avatar */}
              <div className="relative">
                <div className={`
                  absolute -inset-[2px] rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500
                  transition-opacity duration-300
                  ${isHovered ? 'opacity-100' : 'opacity-0'}
                `} />
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-800">
                  {job.clientId?.avatar ? (
                    <img src={job.clientId.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E07B4F]/30 to-neutral-800">
                      <span className="text-sm font-bold text-white/40">
                        {job.clientId?.name?.charAt(0) || "C"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate max-w-[120px]">
                  {job.clientId?.name || (locale === 'ka' ? "კლიენტი" : "Client")}
                </p>
                {truncateLocation(job.location) && (
                  <p className="text-white/40 text-xs truncate max-w-[120px] flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {truncateLocation(job.location)}
                  </p>
                )}
              </div>
            </div>

            {/* View profile button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/users/${job.clientId?._id}`;
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition-all border border-white/10"
            >
              {locale === 'ka' ? 'პროფილი' : 'Profile'}
            </button>
          </div>
        </div>

        {/* Deadline bar */}
        {job.deadline && timeLeft && (
          <div className={`
            px-5 py-3 flex items-center justify-center gap-2 border-t
            ${isExpired
              ? "border-red-500/30 bg-red-500/10"
              : isUrgent
                ? "border-orange-500/30 bg-orange-500/10"
                : "border-white/10"
            }
          `}>
            <svg
              className={`w-4 h-4 ${
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

        {/* Hover reveal arrow */}
        <div className={`
          absolute bottom-5 right-5 w-10 h-10 rounded-full
          bg-white flex items-center justify-center
          transition-all duration-500 ease-out z-20
          ${isHovered && !job.deadline ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
        `}>
          <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
