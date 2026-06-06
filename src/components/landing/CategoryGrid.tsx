"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useCountryLink } from "@/hooks/useCountry";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { AnimatedSection } from "./_internal";

interface CategoryGridProps {
  /** Opens the intake modal - used by the "All services" escape-hatch card. */
  onIntakeOpen: () => void;
}

/**
 * Category strip - Checkatrade-pattern card grid. Simple white cards
 * with icon + label; centered heading; no glass effect, no mono
 * eyebrow. Sits directly below the brand-banner hero.
 */
export default function CategoryGrid({ onIntakeOpen }: CategoryGridProps) {
  const { t, pick } = useLanguage();
  const { categories } = useCategories();
  const { trackEvent } = useAnalytics();
  const cl = useCountryLink();

  const handleCategoryClick = useCallback(
    (categoryKey: string) => {
      trackEvent(AnalyticsEvent.LANDING_CATEGORY_CLICK, {
        category: categoryKey,
      });
    },
    [trackEvent],
  );

  return (
    <section className="py-14 sm:py-20 bg-[var(--hm-bg-page)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection className="text-center mb-8 sm:mb-10">
          <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.015em] text-[var(--hm-fg-primary)]">
            {t("landing.categoriesTitle")}
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.slice(0, 6).map((cat, i) => {
            const accent = cat.color || "var(--hm-brand-500)";
            return (
              <AnimatedSection key={cat.key} stagger index={i}>
                <Link
                  href={cl(
                    `/professionals?category=${encodeURIComponent(cat.key)}`,
                  )}
                  onClick={() => handleCategoryClick(cat.key)}
                  className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-[var(--hm-bg-elevated)] border border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
                >
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: `${accent}14`,
                      color: accent,
                    }}
                  >
                    <CategoryIcon
                      type={cat.icon || cat.key}
                      className="w-6 h-6 sm:w-7 sm:h-7"
                    />
                  </div>
                  <span className="text-[12px] sm:text-[13px] font-semibold text-center text-[var(--hm-fg-primary)] leading-tight">
                    {pick({ en: cat.name, ka: cat.nameKa })}
                  </span>
                </Link>
              </AnimatedSection>
            );
          })}

          {/* "All services" escape hatch - opens intake instead of search */}
          <AnimatedSection stagger index={6}>
            <button
              type="button"
              onClick={onIntakeOpen}
              className="group w-full h-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-[var(--hm-bg-elevated)] border-2 border-dashed border-[var(--hm-border)] hover:border-[var(--hm-brand-500)]/50 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--hm-brand-500) 8%, transparent)",
                }}
              >
                <LayoutGrid
                  className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--hm-brand-500)]"
                  strokeWidth={1.75}
                />
              </div>
              <span className="text-[12px] sm:text-[13px] font-semibold text-center text-[var(--hm-fg-primary)] leading-tight">
                {t("landing.categoriesAllServices")}
              </span>
            </button>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
