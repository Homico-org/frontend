"use client";

import {
  BadgeCheck,
  Briefcase,
  ChevronRight,
  Crown,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import Avatar from "@/components/common/Avatar";
import Link from "next/link";
import { ProfessionalCardData } from "./types";
import { useLanguage } from "@/contexts/LanguageContext";

interface MiniProCardProps {
  professional: ProfessionalCardData;
  locale?: string;
}

export default function MiniProCard({
  professional,
}: MiniProCardProps) {
  const { t, pick } = useLanguage();
  const {
    name,
    avatar,
    title,
    isVerified,
    isPremium,
    avgRating,
    totalReviews,
    primaryCategory,
    primaryCategoryKa,
    priceRange,
    portfolioCount,
    completedJobs,
    profileUrl,
  } = professional;

  const categoryName = primaryCategoryKa
    ? pick({ en: primaryCategory, ka: primaryCategoryKa })
    : primaryCategory;

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return `₾${price.toLocaleString()}`;
  };

  const getPriceLabel = () => {
    if (!priceRange) return null;

    if (priceRange.model === "byAgreement") {
      return t("common.negotiable");
    }

    if (priceRange.model === "per_sqm") {
      const minStr = formatPrice(priceRange.min);
      return minStr ? `${minStr}/m²` : null;
    }

    if (priceRange.min && priceRange.max && priceRange.min !== priceRange.max) {
      return `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`;
    }

    return formatPrice(priceRange.min);
  };

  const priceLabel = getPriceLabel();

  return (
    <Link
      href={profileUrl}
      className="flex items-start gap-3 p-3 rounded-xl border hover:border-[var(--hm-brand-500)]/30 hover:shadow-sm transition-all group"
      style={{ backgroundColor: 'var(--hm-bg-elevated)', borderColor: 'var(--hm-border-subtle)' }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar src={avatar} name={name} size="md" />
        {isPremium && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name and verified */}
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate text-sm group-hover:text-[var(--hm-brand-500)] transition-colors" style={{ color: 'var(--hm-fg-primary)' }}>
            {name}
          </span>
          {isVerified && (
            <BadgeCheck className="w-4 h-4 text-[var(--hm-info-500)] flex-shrink-0" />
          )}
        </div>

        {/* Title/Category */}
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--hm-fg-secondary)' }}>
          {title || categoryName}
        </p>

        {/* Rating and stats */}
        <div className="flex items-center gap-3 mt-1.5">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-[var(--hm-warning-500)] fill-amber-400" />
            <span className="text-xs font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: 'var(--hm-fg-muted)' }}>({totalReviews})</span>
          </div>

          {/* Portfolio */}
          {portfolioCount > 0 && (
            <div className="flex items-center gap-1 " style={{ color: 'var(--hm-fg-muted)' }}>
              <ImageIcon className="w-3 h-3" />
              <span className="text-xs">{portfolioCount}</span>
            </div>
          )}

          {/* Completed jobs */}
          {completedJobs > 0 && (
            <div className="flex items-center gap-1 " style={{ color: 'var(--hm-fg-muted)' }}>
              <Briefcase className="w-3 h-3" />
              <span className="text-xs">{completedJobs}</span>
            </div>
          )}
        </div>

        {/* Price */}
        {priceLabel && (
          <div className="mt-1.5">
            <span className="text-xs font-medium text-[var(--hm-brand-500)]">
              {priceLabel}
            </span>
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 self-center group-hover:text-[var(--hm-brand-500)] transition-colors" style={{ color: 'var(--hm-fg-muted)' }}>
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
