"use client";

import Avatar from "@/components/common/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiStarDisplay } from "@/components/ui/StarRating";
import { ACCENT_COLOR } from "@/constants/theme";
import { storage } from "@/services/storage";
import {
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { backOrNavigate } from "@/utils/navigationUtils";
interface ProfileHeroProps {
  name: string;
  title?: string;
  avatar?: string;
  coverImage?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  avgRating?: number;
  totalReviews?: number;
  yearsExperience?: number;
  location?: string;
  memberSince?: number;
  basePrice?: number;
  maxPrice?: number;
  pricingModel?: "fixed" | "range" | "byAgreement";
  phone?: string;
  phoneRevealed?: boolean;
  locale: string;
  onContact?: () => void;
  onShare?: () => void;
  onRevealPhone?: () => void;
  isBasicTier?: boolean;
}

export default function ProfileHero({
  name,
  title,
  avatar,
  coverImage,
  isVerified = false,
  isAvailable = false,
  avgRating = 0,
  totalReviews = 0,
  yearsExperience = 0,
  location,
  memberSince,
  basePrice,
  maxPrice,
  pricingModel,
  phone,
  phoneRevealed = false,
  locale,
  onContact,
  onShare,
  onRevealPhone,
  isBasicTier = false,
}: ProfileHeroProps) {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { t } = useLanguage();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const avatarUrl = avatar || "";

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden transition-all duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Cover Image or Gradient Background */}
      <div className="absolute inset-0 h-48 md:h-56">
        {coverImage ? (
          <>
            <Image
              src={storage.getFileUrl(coverImage)}
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
          </>
        ) : (
          <>
            {/* Elegant warm gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#E8DDD4] via-[#D4C4B8] to-[#C4A98C] dark:from-[#2A2420] dark:via-[#1E1A17] dark:to-[#151210]" />

            {/* Decorative circles */}
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
                style={{ backgroundColor: ACCENT_COLOR }}
              />
              <div
                className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
                style={{ backgroundColor: ACCENT_COLOR }}
              />
              <div
                className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full opacity-10"
                style={{ backgroundColor: ACCENT_COLOR }}
              />
            </div>

            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back & Share buttons */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => backOrNavigate(router, "/browse")}
            className="rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-neutral-800"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            {t("common.back")}
          </Button>

          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="rounded-full bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-neutral-800"
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              {t("common.share")}
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl mt-16 md:mt-20 p-6 md:p-8">
          {/* Avatar - positioned to overlap the cover */}
          <div className="absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={storage.getFileUrl(avatarUrl)}
                  alt={name}
                  width={128}
                  height={128}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-4 ring-white dark:ring-neutral-900 shadow-2xl"
                />
              ) : (
                <Avatar
                  name={name}
                  size="2xl"
                  className="w-28 h-28 md:w-36 md:h-36 ring-4 ring-white dark:ring-neutral-900 shadow-2xl text-4xl md:text-5xl"
                />
              )}

              {/* Verified badge */}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-900 flex items-center justify-center shadow-lg">
                  <BadgeCheck className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Available indicator */}
              {isAvailable && !isVerified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-900 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Profile info */}
          <div className="text-center pt-14 md:pt-18">
            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
              {name}
            </h1>

            {/* Title */}
            {title && (
              <p
                className="text-base md:text-lg font-medium mb-4"
                style={{ color: ACCENT_COLOR }}
              >
                {title}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6 text-sm mb-6">
              {avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <MultiStarDisplay rating={avgRating} size="sm" />
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-neutral-500">({totalReviews})</span>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}

              {yearsExperience > 0 && (
                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                  <Briefcase className="w-4 h-4" />
                  <span>
                    {yearsExperience}+ {t("heroes.yrs")}
                  </span>
                </div>
              )}

              {memberSince && (
                <div className="flex items-center gap-1.5 text-neutral-500">
                  <span>•</span>
                  <span>
                    {t("common.member")} {memberSince}
                    {locale === "ka" ? "-დან" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Price display */}
            {(pricingModel === "byAgreement" ||
              (basePrice && basePrice > 0) ||
              (maxPrice && maxPrice > 0)) && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {pricingModel === "byAgreement"
                    ? t("common.negotiable")
                    : pricingModel === "per_sqm"
                      ? `${basePrice || maxPrice || 0}₾${t("timeUnits.perSqm")}`
                    : pricingModel === "range"
                      ? `${basePrice || 0}₾ - ${maxPrice || 0}₾`
                      : `${basePrice || maxPrice || 0}₾`}
                </span>
                {pricingModel && pricingModel !== "fixed" && (
                  <Badge variant="secondary" size="sm">
                    {pricingModel === "byAgreement"
                      ? t("common.negotiable")
                      : pricingModel === "per_sqm"
                        ? t("professional.perSqm")
                      : t("common.priceRange")}
                  </Badge>
                )}
              </div>
            )}

            {/* CTA Button */}
            <div className="flex justify-center">
              {phoneRevealed && phone ? (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, ${ACCENT_COLOR}dd 100%)`,
                  }}
                >
                  <Phone className="w-4 h-4" />
                  {phone}
                </a>
              ) : (
                <Button
                  onClick={isBasicTier ? onRevealPhone : onContact}
                  className="rounded-full px-8"
                  size="lg"
                  leftIcon={
                    isBasicTier ? (
                      <Phone className="w-4 h-4" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )
                  }
                >
                  {isBasicTier ? t("heroes.showPhone") : t("heroes.contact")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
