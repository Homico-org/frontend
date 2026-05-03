"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import Select, { type SelectOption } from "@/components/common/Select";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { ArrowRight, Check, PhoneCall, Search, Shield, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";

interface LandingHeroProps {
  onIntakeOpen: () => void;
}

// TaskRabbit-style centered hero: full-bleed worker photo background, centered
// headline + search + popular category icons. Drop a real Tbilisi worker photo
// at frontend/public/landing/hero-worker.jpg (recommended: 1920×1280 cropped to
// the upper-third focal area, <250KB after compression). Until then the warm
// gradient fallback below renders so the page never looks broken.
const HERO_IMAGE_SRC = "/landing/hero-worker.jpg";

export default function LandingHero({ onIntakeOpen }: LandingHeroProps) {
  const { t, pick } = useLanguage();
  const { categories } = useCategories();
  const { trackEvent } = useAnalytics();
  const router = useRouter();

  const [heroCategory, setHeroCategory] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHeroSearch = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      trackEvent(AnalyticsEvent.LANDING_HERO_SEARCH, {
        category: heroCategory || "all",
      });
      const target = heroCategory
        ? `/professionals?category=${encodeURIComponent(heroCategory)}`
        : "/professionals";
      router.push(target);
    },
    [heroCategory, router, trackEvent],
  );

  const handleCategoryClick = useCallback(
    (categoryKey: string) => {
      trackEvent(AnalyticsEvent.LANDING_CATEGORY_CLICK, {
        category: categoryKey,
        label: "hero_icon_row",
      });
    },
    [trackEvent],
  );

  const heroSearchOptions: SelectOption[] = [
    { value: "", label: t("landing.searchAllOption") },
    ...categories.map((cat) => ({
      value: cat.key,
      label: pick({ en: cat.name, ka: cat.nameKa }),
    })),
  ];

  // Top 6 categories shown as TaskRabbit-style icon row under the search bar.
  const heroCategoryRow = categories.slice(0, 6);

  return (
    <section className="relative overflow-hidden isolate">
      {/* Background image: worker at work. Falls back to a warm gradient with
          decorative brand-tinted blobs if the asset is missing — never reads as
          a blank page. `isolate` on the section creates a clean stacking
          context so the bg layer can't be covered by ancestor backgrounds. */}
      <div className="absolute inset-0">
        {/* Warm vermillion-tinted gradient base. Always visible behind the photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--hm-brand-50) 0%, var(--hm-bg-elevated) 45%, var(--hm-brand-50) 100%)",
          }}
        />

        {/* Decorative brand-tinted blobs — TaskRabbit-style soft shapes that
            keep the hero from looking empty until the real photo lands. */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--hm-brand-500) 28%, transparent) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--hm-brand-300) 35%, transparent) 0%, transparent 70%)",
          }}
        />

        {/* Faint dotted grid for texture (visible only on light bg) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, var(--hm-fg-primary) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <Image
          src={HERO_IMAGE_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={75}
          className="object-cover"
          aria-hidden="true"
        />
        {/* Dark gradient overlay — keeps the photo as a moody backdrop while
            white text floats on top with strong contrast. Standard hero-photo
            treatment when text would otherwise fight the photo's tonal range. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,18,14,0.65) 0%, rgba(20,18,14,0.45) 50%, rgba(20,18,14,0.7) 100%)",
          }}
        />
      </div>

      {/* Centered content stack — z-10 to ensure it always paints above the
          background image, which next/image can otherwise stack on top of. */}
      <div
        className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s ease-out",
        }}
      >
        {/* H1 — Fraunces serif, centered, two-line. White text against dark
            photo overlay; sized for Georgian script which renders wider than
            Latin at equivalent px. */}
        <h1 className="text-[26px] sm:text-[36px] lg:text-[44px] font-serif font-medium tracking-[-0.01em] text-white leading-[1.1]">
          <span className="block">{t("landing.heroTitle")}</span>
          <span className="block text-[var(--hm-brand-300)] mt-0.5">
            {t("landing.heroTitleAccent")}
          </span>
        </h1>

        <p
          className="mt-3 sm:mt-4 text-[13px] sm:text-[15px] text-white/85 leading-relaxed max-w-xl mx-auto"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.8s ease-out 0.4s",
          }}
        >
          {t("landing.positionStatement")}
        </p>

        {/* Centered search bar */}
        <form
          onSubmit={handleHeroSearch}
          className="mt-7 sm:mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] shadow-xl shadow-black/[0.06]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.6s ease-out 0.6s",
          }}
        >
          <div className="flex-1 min-w-0">
            <Select
              id="hero-category"
              name="category"
              value={heroCategory}
              onChange={setHeroCategory}
              placeholder={t("landing.searchAllOption")}
              options={heroSearchOptions}
              variant="minimal"
              size="md"
              searchable
            />
          </div>
          <Button
            type="submit"
            className="px-5 inline-flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {t("landing.searchSubmit")}
          </Button>
        </form>

        {/* Category icon row — TaskRabbit pattern */}
        <div
          className="mt-7 sm:mt-9 grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 max-w-2xl mx-auto"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease-out 0.8s",
          }}
        >
          {heroCategoryRow.map((cat) => (
            <Link
              key={cat.key}
              href={`/professionals?category=${encodeURIComponent(cat.key)}`}
              onClick={() => handleCategoryClick(cat.key)}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-300)]/60"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105 bg-white/95"
              >
                <CategoryIcon
                  type={cat.icon || cat.key}
                  className="w-5 h-5 text-[var(--hm-brand-500)]"
                />
              </div>
              <span className="text-[11px] sm:text-[12px] font-medium text-white leading-tight text-center line-clamp-2">
                {pick({ en: cat.name, ka: cat.nameKa })}
              </span>
            </Link>
          ))}
        </div>

        {/* One-line trust strip — earns trust before the action */}
        <div
          className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[12px] sm:text-[13px] text-white/85"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease-out 1s",
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Shield
              className="w-3.5 h-3.5 text-[var(--hm-brand-300)]"
              strokeWidth={2}
            />
            {t("landing.trustPillar1Title")}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Star
              className="w-3.5 h-3.5 text-[var(--hm-brand-300)]"
              strokeWidth={2}
            />
            {t("landing.trustPillar2Title")}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Check
              className="w-3.5 h-3.5 text-[var(--hm-brand-300)]"
              strokeWidth={2}
            />
            {t("landing.trustPillar3Title")}
          </span>
        </div>

        {/* Demoted alternative path — Homico team intake. Smaller card, centered. */}
        <button
          type="button"
          onClick={onIntakeOpen}
          className="mt-7 sm:mt-8 group inline-flex items-center gap-3 max-w-md mx-auto p-3 sm:p-3.5 rounded-2xl border text-left transition-all hover:-translate-y-px hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
          style={{
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease-out 1.2s",
            borderColor:
              "color-mix(in srgb, var(--hm-brand-500) 22%, transparent)",
            backgroundColor:
              "color-mix(in srgb, var(--hm-bg-elevated) 92%, transparent)",
          }}
        >
          <div
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--hm-brand-500)" }}
          >
            <PhoneCall className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] sm:text-[14px] font-semibold text-[var(--hm-fg-primary)] leading-snug">
              {t("landing.askAssistantTitle")}
            </p>
            <p className="mt-0.5 text-[11px] sm:text-[12px] text-[var(--hm-fg-secondary)] leading-relaxed">
              {t("landing.askAssistantBody")}
            </p>
          </div>
          <ArrowRight
            className="shrink-0 w-4 h-4 text-[var(--hm-brand-500)] group-hover:translate-x-0.5 transition-transform"
            strokeWidth={2}
          />
        </button>
      </div>
    </section>
  );
}
