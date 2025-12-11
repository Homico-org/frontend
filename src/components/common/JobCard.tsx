"use client";

import { storage } from "@/services/storage";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";

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

const getPropertyTypeLabel = (type?: string): string => {
  const labels: Record<string, string> = {
    apartment: "ბინა",
    house: "სახლი",
    office: "ოფისი",
    building: "შენობა",
    other: "სხვა",
  };
  return type ? labels[type] || type : "";
};

const getCategoryLabel = (category?: string): string => {
  const labels: Record<string, string> = {
    renovation: "რემონტი",
    plumbing: "სანტექნიკა",
    electrical: "ელექტრობა",
    painting: "მალიარობა",
    flooring: "იატაკი",
    roofing: "სახურავი",
    hvac: "გათბობა/გაგრილება",
    cleaning: "დალაგება",
    landscaping: "ლანდშაფტი",
    moving: "გადაზიდვა",
    furniture: "ავეჯი",
    appliances: "ტექნიკა",
    windows: "ფანჯრები",
    doors: "კარები",
    security: "უსაფრთხოება",
    other: "სხვა",
  };
  return category ? labels[category] || category : "";
};

// Image Slider Component
function ImageSlider({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
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
      <div className="w-full h-full flex items-center justify-center bg-[#D2691E]/5">
        <svg
          className="w-10 h-10 text-[#D2691E]/20"
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
      className="relative w-full h-full overflow-hidden bg-[#D2691E]/5"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Images */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="w-full h-full flex-shrink-0 min-w-full relative"
          >
            {!imageError[idx] ? (
              <img
                src={getImageSrc(img)}
                alt=""
                className="w-full h-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
                onError={() =>
                  setImageError((prev) => ({ ...prev, [idx]: true }))
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#D2691E]/5">
                <svg
                  className="w-8 h-8 text-[#D2691E]/20"
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

      {/* Navigation arrows - only show if multiple images */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 z-10 ${
              isHovering
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-2"
            } hover:bg-black/60 hover:scale-110`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToNext}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 z-10 ${
              isHovering
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-2"
            } hover:bg-black/60 hover:scale-110`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator - center bottom */}
      {images.length > 1 && images.length <= 5 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? "w-4 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* Image counter badge - show for more than 1 image */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium z-10">
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
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Combine media and images - ensure arrays
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
    const hoursDiff =
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    setIsNew(hoursDiff < 24);

    if (job.deadline) {
      const updateCountdown = () => {
        const deadline = new Date(job.deadline!);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft("დასრულდა");
          setDaysLeft(0);
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setDaysLeft(days + (hours > 0 ? hours / 24 : 0));

        if (days > 0) {
          setTimeLeft(`${days}დ ${hours}სთ`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}სთ ${minutes}წთ`);
        } else {
          setTimeLeft(`${minutes}წთ`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
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
      return `${job.budgetMin.toLocaleString()} - ${job.budgetMax.toLocaleString()}₾`;
    }
    return "შეთანხმებით";
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return "ახლა";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} წთ`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} სთ`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} დღე`;
    return new Date(date).toLocaleDateString("ka-GE", {
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
  if (job.propertyType) metaItems.push(getPropertyTypeLabel(job.propertyType));
  if (job.areaSize) metaItems.push(`${job.areaSize} მ²`);
  if (job.roomCount) metaItems.push(`${job.roomCount} ოთახი`);

  // Compact variant
  if (variant === "compact") {
    return (
      <Link
        href={`/jobs/${job._id}`}
        className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-[#D2691E]/10 dark:border-[#CD853F]/15 hover:border-[#D2691E]/20"
      >
        <div className="aspect-[4/3] relative overflow-hidden">
          <ImageSlider images={allImages} />
          {/* Compact price badge */}
          <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-[#D2691E]/10">
            <span className="text-xs font-bold text-[#D2691E]">
              {formatBudget()}
            </span>
          </div>
        </div>
        <div className="p-3.5">
          <h3 className="font-medium text-[13px] line-clamp-2 mb-1.5 text-[var(--color-text-primary)] group-hover:text-[#D2691E] transition-colors">
            {job.title}
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {truncateLocation(job.location)}
          </p>
        </div>
      </Link>
    );
  }

  // List variant
  if (variant === "list") {
    return (
      <Link
        href={`/jobs/${job._id}`}
        className="group flex items-center gap-3 py-3 border-b border-[#D2691E]/10 hover:bg-[#D2691E]/[0.03] transition-colors -mx-2 px-2 rounded-lg"
      >
        <Avatar
          src={job.clientId?.avatar}
          name={job.clientId?.name || "Client"}
          size="sm"
          rounded="full"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-[var(--color-text-primary)] group-hover:text-[#D2691E] transition-colors truncate">
            {job.title}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            {truncateLocation(job.location)} · {getTimeAgo(job.createdAt)}
          </p>
        </div>
        <span className="font-bold text-sm text-[#D2691E]">
          {formatBudget()}
        </span>
      </Link>
    );
  }

  // Default variant - Transparent terracotta card
  return (
    <Link
      href={`/jobs/${job._id}`}
      className={`group relative block h-full rounded-2xl transition-all duration-300 ease-out overflow-hidden backdrop-blur-sm ${
        isUrgent
          ? "bg-white/20 dark:bg-gray-900/50 border-2 border-[#D2691E]/25"
          : isExpired
            ? "bg-white/10 dark:bg-gray-900/40 border-2 border-red-400/20"
            : "bg-white/10 dark:bg-gray-900/40 border-2 border-[#D2691E]/10 dark:border-[#CD853F]/15"
      } hover:border-[#D2691E]/20 hover:-translate-y-0.5`}
    >
      {/* Image Slider Section - Always show */}
      <div className="aspect-[16/10] relative overflow-hidden">
        <ImageSlider images={allImages} />

        {/* Budget badge - top right */}
        <div className="absolute top-3 right-3 z-20">
          <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-[#D2691E]/10">
            <span className="text-sm font-bold text-[#D2691E]">
              {formatBudget()}
            </span>
          </div>
        </div>

        {/* Category badge - top left */}
        {job.category && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider z-20 bg-[#D2691E] text-white">
            {getCategoryLabel(job.category)}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col">
        {/* Top row: New badge + Time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isNew && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[#D2691E]">
                <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                ახალი
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {getTimeAgo(job.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold leading-snug text-[var(--color-text-primary)] group-hover:text-[#D2691E] transition-colors line-clamp-2 mb-2">
          {job.title}
        </h3>

        {/* Description */}
        <p className="text-[12px] leading-relaxed text-[var(--color-text-tertiary)] line-clamp-2 mb-3">
          {job.description || "დეტალური აღწერა იხილეთ განცხადებაში"}
        </p>

        {/* Meta items */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--color-text-muted)] mb-3">
          {metaItems.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-[#D2691E]/30">·</span>}
              {item}
            </span>
          ))}
          {job.proposalCount > 0 && (
            <>
              {metaItems.length > 0 && (
                <span className="text-[#D2691E]/30">·</span>
              )}
              <span className="text-[#D2691E] font-medium">
                {job.proposalCount} შეთავაზება
              </span>
            </>
          )}
        </div>

        {/* Bottom: Client + Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#D2691E]/10">
          <div className="flex items-center gap-2">
            <Avatar
              src={job.clientId?.avatar}
              name={job.clientId?.name || "Client"}
              size="sm"
              rounded="full"
            />
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--color-text-primary)] truncate max-w-[100px]">
                {job.clientId?.name || "კლიენტი"}
              </p>
              {truncateLocation(job.location) && (
                <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[100px]">
                  {truncateLocation(job.location)}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSave?.(job._id);
              }}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                isSaved
                  ? "bg-[#D2691E] text-white"
                  : "bg-[#D2691E]/10 text-[#D2691E] hover:bg-[#D2691E]/20"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
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
              {isSaved ? "შენახული" : "შენახვა"}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/users/${job.clientId?._id}`;
              }}
              className="p-1.5 rounded-lg bg-[#D2691E]/10 text-[#D2691E] hover:bg-[#D2691E]/20 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Deadline bar - minimal */}
      {job.deadline && timeLeft && (
        <div
          className={`px-4 py-2 flex items-center justify-center gap-2 border-t ${
            isExpired
              ? "border-red-200/30 dark:border-red-800/20"
              : isUrgent
                ? "border-[#D2691E]/20"
                : "border-[#D2691E]/10"
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 ${
              isExpired
                ? "text-red-500"
                : isUrgent
                  ? "text-[#CD853F]"
                  : "text-[#D2691E]"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span
            className={`text-[11px] font-medium ${
              isExpired
                ? "text-red-500"
                : isUrgent
                  ? "text-[#CD853F]"
                  : "text-[#D2691E]"
            }`}
          >
            {isExpired ? "ვადა ამოიწურა" : `დარჩა: ${timeLeft}`}
          </span>
          {isUrgent && !isExpired && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded text-[#CD853F] bg-[#D2691E]/10">
              სასწრაფო
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
