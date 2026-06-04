"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountry, useCountryLink } from "@/hooks/useCountry";
import { api } from "@/lib/api";
import type { Job } from "@/types/shared/job";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AnimatedSection } from "./_internal";

/**
 * Recommended jobs strip - Checkatrade-pattern card carousel showing
 * real open client jobs from the marketplace. Public endpoint, no
 * auth required. Country-scoped via useCountry().
 */
export default function RecommendedJobs() {
  const { t, pick, locale } = useLanguage();
  const { categories } = useCategories();
  const cl = useCountryLink();
  const country = useCountry();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; nameKa?: string; color?: string; icon?: string; key: string }>();
    for (const c of categories) m.set(c.key, c);
    return m;
  }, [categories]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    api
      .get(`/jobs?limit=6&status=open&sort=newest&country=${country}`, {
        signal: controller.signal,
      })
      .then((response) => {
        const list: Job[] = response.data?.data || response.data?.jobs || [];
        setJobs(list);
      })
      .catch((err: { name?: string; code?: string }) => {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        setJobs([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [country]);

  const formatBudget = (job: Job): string | null => {
    if (job.budgetAmount) return `${job.budgetAmount.toLocaleString(locale)} ₾`;
    if (job.budgetMin && job.budgetMax) {
      return `${job.budgetMin.toLocaleString(locale)} - ${job.budgetMax.toLocaleString(locale)} ₾`;
    }
    if (job.budgetMin) return `${t("common.from")} ${job.budgetMin.toLocaleString(locale)} ₾`;
    return null;
  };

  return (
    <section className="py-14 sm:py-20 bg-[var(--hm-bg-elevated)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatedSection className="text-center mb-8 sm:mb-10">
          <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.015em] text-[var(--hm-fg-primary)]">
            {t("landing.recommendedJobs")}
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-[var(--hm-fg-secondary)]">
            {t("landing.recommendedJobsSubtitle")}
          </p>
        </AnimatedSection>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-page)] p-5 h-[180px] animate-pulse"
              >
                <div className="h-5 w-20 bg-[var(--hm-bg-tertiary)] rounded-full mb-4" />
                <div className="h-4 w-3/4 bg-[var(--hm-bg-tertiary)] rounded mb-2" />
                <div className="h-4 w-1/2 bg-[var(--hm-bg-tertiary)] rounded mb-4" />
                <div className="h-3 w-2/3 bg-[var(--hm-bg-tertiary)] rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-10 text-[15px] text-[var(--hm-fg-muted)]">
            {t("landing.recommendedJobsEmpty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {jobs.map((job, i) => {
              const cat = categoryMap.get(job.category);
              const accent = cat?.color || "var(--hm-brand-500)";
              const catLabel = cat
                ? pick({ en: cat.name, ka: cat.nameKa })
                : job.category;
              const budget = formatBudget(job);

              return (
                <AnimatedSection key={job.id} stagger index={i}>
                  <Link
                    href={cl(`/jobs/${job.id}`)}
                    className="group flex flex-col gap-3 h-full p-5 rounded-2xl bg-[var(--hm-bg-page)] border border-[var(--hm-border-subtle)] hover:border-[var(--hm-brand-500)]/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: `${accent}14`,
                          color: accent,
                        }}
                      >
                        <CategoryIcon
                          type={cat?.icon || job.category}
                          className="w-3.5 h-3.5"
                        />
                        {catLabel}
                      </span>
                      {budget && (
                        <span className="text-[13px] font-semibold text-[var(--hm-fg-primary)] whitespace-nowrap">
                          {budget}
                        </span>
                      )}
                    </div>

                    <h3 className="text-[15px] sm:text-[16px] font-semibold text-[var(--hm-fg-primary)] leading-snug line-clamp-2">
                      {job.title}
                    </h3>

                    {job.description && (
                      <p className="text-[13px] text-[var(--hm-fg-secondary)] leading-relaxed line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between text-[12px] text-[var(--hm-fg-muted)]">
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 ml-auto text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="mt-8 sm:mt-10 text-center">
            <Link
              href={cl("/jobs")}
              className="inline-flex items-center gap-1.5 text-[14px] sm:text-[15px] font-semibold text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-600)] underline decoration-[var(--hm-brand-500)]/30 hover:decoration-[var(--hm-brand-500)] underline-offset-4 transition-colors"
            >
              {t("landing.recommendedJobsViewAll")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
