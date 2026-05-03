"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { AnimatedSection, GlassCard } from "./_internal";

interface CategoryGridProps {
  /** Opens the intake modal — used by the "All services" escape-hatch card. */
  onIntakeOpen: () => void;
}

export default function CategoryGrid({ onIntakeOpen }: CategoryGridProps) {
  const { t, pick } = useLanguage();
  const { categories } = useCategories();
  const { trackEvent } = useAnalytics();

  const handleCategoryClick = useCallback(
    (categoryKey: string) => {
      trackEvent(AnalyticsEvent.LANDING_CATEGORY_CLICK, {
        category: categoryKey,
      });
    },
    [trackEvent],
  );

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection className="max-w-xl mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-serif font-medium text-[var(--hm-fg-primary)] tracking-tight">
            {t("landing.categoriesTitle")}
          </h2>
          <p className="mt-2 text-[14px] text-[var(--hm-fg-muted)]">
            {t("landing.categoriesTapHint")}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.slice(0, 8).map((cat, i) => (
            <AnimatedSection key={cat.key} stagger index={i}>
              <Link
                href={`/professionals?category=${encodeURIComponent(cat.key)}`}
                onClick={() => handleCategoryClick(cat.key)}
                className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 rounded-2xl"
              >
                <GlassCard className="group relative h-full flex flex-col gap-3 p-5 rounded-2xl hover:border-[var(--hm-brand-500)]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--hm-brand-500) 10%, transparent)",
                    }}
                  >
                    <CategoryIcon
                      type={cat.icon || cat.key}
                      className="w-6 h-6 text-[var(--hm-brand-500)]"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[14px] font-semibold text-[var(--hm-fg-primary)] leading-snug">
                      {pick({ en: cat.name, ka: cat.nameKa })}
                    </span>
                    <ArrowRight
                      className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                      strokeWidth={1.75}
                    />
                  </div>
                </GlassCard>
              </Link>
            </AnimatedSection>
          ))}

          {/* "All services" escape hatch for needs outside the top 8 — opens intake instead of search */}
          <AnimatedSection stagger index={8}>
            <button
              type="button"
              onClick={onIntakeOpen}
              className="w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40 rounded-2xl"
            >
              <div
                className="group relative h-full flex flex-col gap-3 p-5 rounded-2xl border-2 border-dashed hover:border-[var(--hm-brand-500)]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                style={{ borderColor: "var(--hm-border)" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--hm-brand-500) 6%, transparent)",
                  }}
                >
                  <Sparkles
                    className="w-6 h-6 text-[var(--hm-brand-500)]"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[14px] font-semibold text-[var(--hm-fg-primary)] leading-snug">
                    {t("landing.categoriesAllServices")}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                </div>
              </div>
            </button>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
