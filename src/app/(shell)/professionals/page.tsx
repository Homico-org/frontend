"use client";

import EmptyState from "@/components/common/EmptyState";
import ProCard from "@/components/common/ProCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useLikes } from "@/hooks/useLikes";
import { api } from "@/lib/api";
import { LikeTargetType, ProProfile } from "@/types";
import { ArrowRight, Briefcase, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ProfessionalsPage() {
  const { t, locale } = useLanguage();
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
        if (selectedCity && selectedCity !== "tbilisi")
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
        trackEvent(AnalyticsEvent.CATEGORY_SELECT, { category: selectedCategory });
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
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-xl p-3 sm:p-5 border border-neutral-200/70 dark:border-neutral-800/80"
        >
          <div className="flex items-start gap-3 sm:flex-col sm:items-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0 sm:w-full sm:mt-3">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 sm:mx-auto animate-pulse mb-2" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 sm:mx-auto animate-pulse" />
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
      {/* CTA: Guest → Register as Pro | Client → Post a Job */}
      {!isLoading && results.length > 0 && (
        <>
          {!isAuthenticated && (
            <Link
              href="/register"
              className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-[#C4735B]/10 to-[#C4735B]/5 border border-[#C4735B]/20 rounded-xl sm:rounded-2xl hover:border-[#C4735B]/40 transition-all group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#C4735B]/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#C4735B]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-neutral-900 truncate">
                    {locale === 'ka' ? 'დარეგისტრირდი პროფესიონალად' : 'Register as a Professional'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
                    {locale === 'ka' ? 'შემოგვიერთდი და იპოვე კლიენტები' : 'Join and start finding clients'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#C4735B] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {isAuthenticated && user?.role === 'client' && (
            <Link
              href="/post-job"
              className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-[#C4735B]/10 to-[#C4735B]/5 border border-[#C4735B]/20 rounded-xl sm:rounded-2xl hover:border-[#C4735B]/40 transition-all group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#C4735B]/15 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[#C4735B]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-neutral-900 truncate">
                    {locale === 'ka' ? 'განათავსე პროექტი' : 'Post a Job to Find a Pro'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
                    {locale === 'ka' ? 'აღწერე პროექტი და მიიღე შეთავაზებები' : 'Describe your project and get proposals'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#C4735B] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </>
      )}

      {isLoading ? (
        <ProfessionalsSkeleton />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 items-stretch">
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
              />
            </div>
          ))}
        </div>
      ) : (
        <ProfessionalsEmptyState />
      )}

      <div ref={loaderRef} className="flex justify-center py-6 sm:py-10">
        {isLoadingMore && (
          <div className="flex items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl glass-card">
            <LoadingSpinner size="sm" variant="border" color="#E07B4F" />
            <span className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
              {t("browse.loadingMore")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
