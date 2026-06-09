"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCountryLink } from "@/hooks/useCountry";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";

interface LandingHeroProps {
  onIntakeOpen: () => void;
}

/**
 * Hero background image. Swap to any of the /landing/*.jpg assets
 * (kitchen.jpg, hero-worker.jpg, became-pro.jpg) or drop in a new
 * file. Recommended: wide landscape, designer interior, warm tones.
 */
const HERO_BG_IMAGE = "/landing/kitchen.jpg";

/**
 * Landing hero - brand-banner + search-trigger (v11).
 *
 * v10 had a functional search input that submitted to /professionals.
 * Simpler UX: the pill is now a single navigation trigger - click
 * anywhere on it and we drop the user straight into /professionals
 * where the real search/filter UI lives. No half-typed confusion,
 * no modal middleman.
 */
export default function LandingHero({ onIntakeOpen }: LandingHeroProps) {
  const { t } = useLanguage();
  const { trackEvent } = useAnalytics();
  const cl = useCountryLink();

  const handleSearchClick = useCallback(() => {
    trackEvent(AnalyticsEvent.LANDING_CATEGORY_CLICK, {
      label: "hero_search",
    });
  }, [trackEvent]);

  return (
    <section className="relative isolate overflow-hidden bg-[var(--hm-brand-500)]">
      {/* Background image - object-cover for full bleed */}
      <Image
        src={HERO_BG_IMAGE}
        alt=""
        fill
        priority
        quality={80}
        sizes="100vw"
        className="object-cover -z-10"
      />
      {/* Brand-tinted scrim - keeps text legible while preserving
          brand presence. Warm orange wash on top, deeper at bottom
          so the centered copy block stays high-contrast. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--hm-brand-500) 88%, transparent) 0%, color-mix(in srgb, var(--hm-brand-500) 78%, transparent) 60%, color-mix(in srgb, #1a0a05 82%, transparent) 100%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <h1
          className="font-bold tracking-[-0.025em] leading-[1.05] text-white"
          style={{ fontSize: "clamp(32px, 4.6vw, 52px)" }}
        >
          {t("landing.heroTitle")}
        </h1>

        <p
          className="mt-3 sm:mt-4 font-semibold tracking-[-0.015em] text-white/95"
          style={{ fontSize: "clamp(16px, 2vw, 22px)" }}
        >
          {t("landing.heroTitleAccent")}
        </p>

        <Link
          href={cl("/professionals")}
          onClick={handleSearchClick}
          className="mt-7 sm:mt-9 max-w-xl mx-auto block group focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40 rounded-xl"
          role="search"
          aria-label={t("landing.searchPlaceholder")}
        >
          <div className="relative flex items-center bg-white rounded-xl shadow-md shadow-black/10 px-5 py-4 sm:py-[18px] group-hover:shadow-lg group-hover:shadow-black/15 transition-all">
            <Search
              className="w-5 h-5 text-[var(--hm-fg-muted)] shrink-0"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span className="flex-1 px-3 text-[15px] sm:text-[16px] text-left text-[var(--hm-fg-muted)] truncate">
              {t("landing.searchPlaceholder")}
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={onIntakeOpen}
          className="mt-3 sm:mt-4 text-[13px] sm:text-[14px] font-medium text-white/90 hover:text-white underline decoration-white/40 hover:decoration-white underline-offset-[3px] transition-colors"
        >
          {t("concierge.requestQuote")}
        </button>
      </div>
    </section>
  );
}
