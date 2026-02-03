'use client';

import { BadgeCheck, Briefcase, Crown, Image as ImageIcon, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ProfessionalCardData } from './types';

interface MiniProCardProps {
  professional: ProfessionalCardData;
  locale: string;
}

export default function MiniProCard({ professional, locale }: MiniProCardProps) {
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

  const categoryName = locale === 'ka' && primaryCategoryKa ? primaryCategoryKa : primaryCategory;

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return `₾${price.toLocaleString()}`;
  };

  const getPriceLabel = () => {
    if (!priceRange) return null;

    if (priceRange.model === 'byAgreement') {
      return locale === 'ka' ? 'შეთანხმებით' : 'By Agreement';
    }

    if (priceRange.model === 'per_sqm') {
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
      className="flex items-start gap-3 p-3 bg-white rounded-xl border border-neutral-100 hover:border-[#C4735B]/30 hover:shadow-sm transition-all group"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-lg font-medium">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
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
          <span className="font-medium text-neutral-900 truncate text-sm group-hover:text-[#C4735B] transition-colors">
            {name}
          </span>
          {isVerified && (
            <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
        </div>

        {/* Title/Category */}
        <p className="text-xs text-neutral-500 truncate mt-0.5">
          {title || categoryName}
        </p>

        {/* Rating and stats */}
        <div className="flex items-center gap-3 mt-1.5">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-medium text-neutral-700">
              {avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400">
              ({totalReviews})
            </span>
          </div>

          {/* Portfolio */}
          {portfolioCount > 0 && (
            <div className="flex items-center gap-1 text-neutral-400">
              <ImageIcon className="w-3 h-3" />
              <span className="text-xs">{portfolioCount}</span>
            </div>
          )}

          {/* Completed jobs */}
          {completedJobs > 0 && (
            <div className="flex items-center gap-1 text-neutral-400">
              <Briefcase className="w-3 h-3" />
              <span className="text-xs">{completedJobs}</span>
            </div>
          )}
        </div>

        {/* Price */}
        {priceLabel && (
          <div className="mt-1.5">
            <span className="text-xs font-medium text-[#C4735B]">
              {priceLabel}
            </span>
          </div>
        )}
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 self-center text-neutral-300 group-hover:text-[#C4735B] transition-colors">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
