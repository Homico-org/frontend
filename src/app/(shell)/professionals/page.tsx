"use client";

import EmptyState from "@/components/common/EmptyState";
import ProCard from "@/components/common/ProCard";
import BrowseFilterBar from "@/components/browse/BrowseFilterBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useLikes } from "@/hooks/useLikes";
import { api } from "@/lib/api";
import { LikeTargetType, ProProfile } from "@/types";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ProfessionalsPage() {
  const { t, pick } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { trackEvent } = useAnalytics();
  const {
    selectedCategory,
    selectedSubcategories,
    minRating,
    searchQuery,
    sortBy,
    selectedCity,
    budgetMin,
    budgetMax,
  } = useBrowseContext();
  const { toggleLike } = useLikes();

  const [results, setResults] = useState<ProProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on back navigation
  useEffect(() => {
    const saved = sessionStorage.getItem('browseScrollY');
    if (saved) {
      const y = parseInt(saved, 10);
      sessionStorage.removeItem('browseScrollY');
      setTimeout(() => window.scrollTo(0, y), 100);
    }
  }, []);

  const fetchProfessionals = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        if (reset) setIsLoading(true);
        else setIsLoadingMore(true);

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "12");

        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedSubcategories.length > 0)
          params.append("subcategories", selectedSubcategories.join(","));
        if (minRating > 0) params.append("minRating", minRating.toString());
        if (searchQuery) params.append("search", searchQuery);
        if (sortBy && sortBy !== "recommended") params.append("sort", sortBy);
        if (selectedCity && selectedCity !== "all")
          params.append("serviceArea", selectedCity);
        if (budgetMin !== null) params.append("minPrice", budgetMin.toString());
        if (budgetMax !== null) params.append("maxPrice", budgetMax.toString());

        const response = await api.get(`/users/pros?${params.toString()}`);
        const result = response.data;
        const profiles = result.data as ProProfile[];
        const pagination = result.pagination || {};

        if (reset) setResults(profiles);
        else setResults((prev) => [...prev, ...profiles]);

        setHasMore(
          pagination.hasMore ?? (profiles.length === 12 && profiles.length > 0),
        );
      } catch (error) {
        console.error("Error fetching professionals:", error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      selectedCategory,
      selectedSubcategories,
      minRating,
      searchQuery,
      sortBy,
      selectedCity,
      budgetMin,
      budgetMax,
    ],
  );

  const hasFetchedRef = useRef(false);
  const prevFiltersRef = useRef<string | null>(null);

  useEffect(() => {
    const filterKey = JSON.stringify({
      selectedCategory,
      selectedSubcategories,
      minRating,
      searchQuery,
      sortBy,
      selectedCity,
      budgetMin,
      budgetMax,
    });

    if (prevFiltersRef.current === filterKey && hasFetchedRef.current) return;

    if (hasFetchedRef.current && prevFiltersRef.current !== filterKey) {
      if (searchQuery) {
        trackEvent(AnalyticsEvent.SEARCH, {
          searchQuery,
          category: selectedCategory || undefined,
        });
      }
      if (selectedCategory) {
        trackEvent(AnalyticsEvent.CATEGORY_SELECT, {
          category: selectedCategory,
        });
      }
      if (selectedSubcategories.length > 0) {
        trackEvent(AnalyticsEvent.SUBCATEGORY_SELECT, {
          category: selectedCategory || undefined,
          subcategory: selectedSubcategories.join(","),
        });
      }
    }

    prevFiltersRef.current = filterKey;
    hasFetchedRef.current = true;
    setPage(1);
    fetchProfessionals(1, true);
  }, [
    selectedCategory,
    selectedSubcategories,
    minRating,
    searchQuery,
    sortBy,
    selectedCity,
    budgetMin,
    budgetMax,
    fetchProfessionals,
    trackEvent,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  useEffect(() => {
    if (page > 1) fetchProfessionals(page);
  }, [page, fetchProfessionals]);

  const handleProLike = async (proId: string) => {
    if (!user) return;
    await toggleLike(LikeTargetType.PRO_PROFILE, proId);
  };

  const ProfessionalsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)]"
        >
          <div className="grid grid-cols-3 gap-px aspect-[3/1.15] bg-[var(--hm-bg-tertiary)]">
            {[0, 1, 2].map(j => (
              <div key={j} className="bg-[var(--hm-bg-tertiary)] animate-pulse" />
            ))}
          </div>
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--hm-bg-tertiary)] animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--hm-bg-tertiary)] rounded w-2/3 animate-pulse mb-1.5" />
                <div className="h-3 bg-[var(--hm-bg-tertiary)] rounded w-1/3 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 bg-[var(--hm-bg-tertiary)] rounded-full w-16 animate-pulse" />
              <div className="h-5 bg-[var(--hm-bg-tertiary)] rounded-full w-20 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ProfessionalsEmptyState = () => (
    <EmptyState
      icon={Users}
      title="No professionals found"
      titleKa="სპეციალისტები არ მოიძებნა"
      description="Try adjusting your filters or explore different categories to find the right professional"
      descriptionKa="სცადეთ სხვა ფილტრები ან კატეგორია სასურველი სპეციალისტის მოსაძებნად"
      variant="illustrated"
      size="lg"
    />
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <BrowseFilterBar />
      {/* CTA: Guest → Register as Pro | Client → Post a Job */}
      {!isLoading && results.length > 0 && (
        <>
          {!isAuthenticated && (
            <Link
              href="/register"
              className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-[var(--hm-brand-500)]/10 to-[var(--hm-brand-500)]/5 border border-[var(--hm-brand-500)]/20 rounded-xl sm:rounded-2xl hover:border-[var(--hm-brand-500)]/40 transition-all group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--hm-brand-500)]/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--hm-brand-500)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] truncate">
                    {pick({ en: "Register as a Professional", ka: "დარეგისტრირდი პროფესიონალად" })}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[var(--hm-fg-muted)] truncate">
                    {pick({ en: "Join and start finding clients", ka: "შემოგვიერთდი და იპოვე კლიენტები" })}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--hm-brand-500)] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </>
      )}

      {isLoading ? (
        <ProfessionalsSkeleton />
      ) : results.length > 0 ? (
        <>
        <p className="text-xs mb-2" style={{ color: 'var(--hm-fg-muted)' }}>
          {results.length} {t("browse.resultsFound")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {results.map((profile, index) => (
            <div
              key={profile.id || `pro-${index}`}
              className="animate-stagger h-full"
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            >
              <ProCard
                profile={profile}
                onLike={() => handleProLike(profile.id)}
                showLikeButton={true}
                variant="compact"
                activeCategory={selectedCategory || undefined}
                activeSubcategories={selectedSubcategories}
              />
            </div>
          ))}
        </div>
        </>
      ) : (
        <ProfessionalsEmptyState />
      )}

      <div ref={loaderRef} className="flex justify-center py-6 sm:py-10">
        {isLoadingMore && (
          <div className="flex items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl glass-card">
            <LoadingSpinner size="sm" variant="border" color="var(--hm-brand-500)" />
            <span className="text-xs sm:text-sm font-medium text-[var(--hm-fg-secondary)]">
              {t("browse.loadingMore")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
