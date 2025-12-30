"use client";

import EmptyState from "@/components/common/EmptyState";
import ProCard from "@/components/common/ProCard";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useLikes } from "@/hooks/useLikes";
import { LikeTargetType, ProProfile } from "@/types";
import { Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ProfessionalsPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { selectedCategory, selectedSubcategory, minRating, searchQuery, sortBy, selectedCity, budgetMin, budgetMax } = useBrowseContext();
  const { toggleLike } = useLikes();

  const [results, setResults] = useState<ProProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Fetch professionals
  const fetchProfessionals = useCallback(
    async (pageNum: number, reset = false) => {
      try {
        if (reset) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "12");

        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedSubcategory) params.append("subcategory", selectedSubcategory);
        if (minRating > 0) params.append("minRating", minRating.toString());
        if (searchQuery) params.append("search", searchQuery);
        if (sortBy && sortBy !== 'recommended') params.append("sort", sortBy);
        if (selectedCity && selectedCity !== 'tbilisi') params.append("serviceArea", selectedCity);
        if (budgetMin !== null) params.append("priceMin", budgetMin.toString());
        if (budgetMax !== null) params.append("priceMax", budgetMax.toString());

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/pros?${params.toString()}`,
          {
            headers: {
              ...(localStorage.getItem("access_token") && {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              }),
            },
          }
        );

        if (!response.ok) {
          setHasMore(false);
          throw new Error("Failed to fetch");
        }

        const result = await response.json();
        const profiles = result.data as ProProfile[];
        const pagination = result.pagination || {};

        console.log('profiles', profiles);
        if (reset) {
          setResults(profiles);
          // initializeLikeStates(
          //   profiles.map((p: ProProfile) => ({
          //     id: p._id,
          //     isLiked: p.isLiked || false,
          //     likeCount: p.likeCount || 0,
          //   }))
          // );
        } else {
          setResults((prev) => [...prev, ...profiles]);
          // initializeLikeStates(
          //   profiles.map((p: ProProfile) => ({
          //     id: p._id,
          //     isLiked: p.isLiked || false,
          //     likeCount: p.likeCount || 0,
          //   }))
          // );
        }

        setTotalCount(pagination.total || result.total || result.totalCount || 0);
        setHasMore(pagination.hasMore ?? (profiles.length === 12 && profiles.length > 0));
      } catch (error) {
        console.error("Error fetching professionals:", error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, selectedSubcategory, minRating, searchQuery, sortBy, selectedCity, budgetMin, budgetMax]
  );

  // Track if initial fetch has been done to prevent double fetching
  const hasFetchedRef = useRef(false);
  // Track previous filter key to prevent duplicate fetches
  const prevFiltersRef = useRef<string | null>(null);

  // Reset and fetch when filters change
  useEffect(() => {
    // Create a filter key to compare against previous filters
    const filterKey = JSON.stringify({
      selectedCategory,
      selectedSubcategory,
      minRating,
      searchQuery,
      sortBy,
      selectedCity,
      budgetMin,
      budgetMax,
    });

    // Skip if filters haven't changed and we've already fetched
    if (prevFiltersRef.current === filterKey && hasFetchedRef.current) {
      return;
    }

    // Track analytics events only when filters actually change (not initial mount)
    if (hasFetchedRef.current && prevFiltersRef.current !== filterKey) {
      if (searchQuery) {
        trackEvent(AnalyticsEvent.SEARCH, { searchQuery, category: selectedCategory || undefined });
      }
      if (selectedCategory) {
        trackEvent(AnalyticsEvent.CATEGORY_SELECT, { category: selectedCategory });
      }
      if (selectedSubcategory) {
        trackEvent(AnalyticsEvent.SUBCATEGORY_SELECT, { category: selectedCategory || undefined, subcategory: selectedSubcategory });
      }
    }

    // Update refs and fetch
    prevFiltersRef.current = filterKey;
    hasFetchedRef.current = true;
    setPage(1);
    fetchProfessionals(1, true);
  }, [selectedCategory, selectedSubcategory, minRating, searchQuery, sortBy, selectedCity, budgetMin, budgetMax, fetchProfessionals, trackEvent]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchProfessionals(page);
    }
  }, [page, fetchProfessionals]);

  const handleProLike = async (proId: string) => {
    if (!user) return;
    await toggleLike(LikeTargetType.PRO_PROFILE, proId);
  };

  // Compact Loading skeleton - matches new card design
  const ProfessionalsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="pro-card-modern animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Top section */}
          <div className="flex gap-2.5 p-2.5 sm:gap-3 sm:p-3">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-[var(--color-bg-tertiary)]" />
            {/* Info skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-3.5 sm:h-4 rounded w-3/4 bg-[var(--color-bg-tertiary)] mb-1 sm:mb-1.5" />
              <div className="h-2.5 sm:h-3 rounded w-1/2 bg-[var(--color-bg-tertiary)] mb-1.5 sm:mb-2" />
              <div className="flex gap-1.5 sm:gap-2">
                <div className="h-2.5 sm:h-3 rounded w-10 sm:w-12 bg-[var(--color-bg-tertiary)]" />
                <div className="h-2.5 sm:h-3 rounded w-8 sm:w-10 bg-[var(--color-bg-tertiary)]" />
              </div>
            </div>
            {/* Like button skeleton */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--color-bg-tertiary)]" />
          </div>
          {/* Bottom section */}
          <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
            <div className="h-2.5 sm:h-3 rounded w-full bg-[var(--color-bg-tertiary)] mb-1" />
            <div className="h-2.5 sm:h-3 rounded w-2/3 bg-[var(--color-bg-tertiary)] mb-1.5 sm:mb-2" />
            <div className="flex gap-1">
              <div className="h-4 sm:h-5 rounded-md w-14 sm:w-16 bg-[var(--color-bg-tertiary)]" />
              <div className="h-4 sm:h-5 rounded-md w-12 sm:w-14 bg-[var(--color-bg-tertiary)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state using shared component
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
      {/* Results Grid */}
      {isLoading ? (
        <ProfessionalsSkeleton />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {results.map((profile, index) => (
            <div
              key={profile._id}
              className="animate-stagger"
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            >
              <ProCard
                profile={profile}
                onLike={() => handleProLike(profile._id)}
                showLikeButton={true}
                variant="compact"
              />
            </div>
          ))}
        </div>
      ) : (
        <ProfessionalsEmptyState />
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="flex justify-center py-6 sm:py-10">
        {isLoadingMore && (
          <div className="flex items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl glass-card">
            <div className="relative w-4 h-4 sm:w-5 sm:h-5">
              <div className="absolute inset-0 rounded-full border-2 border-[#E07B4F]/20" />
              <div className="absolute inset-0 rounded-full border-2 border-[#E07B4F] border-t-transparent animate-spin" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'იტვირთება...' : 'Loading more...'}
            </span>
          </div>
        )}
        {!hasMore && results.length > 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-tertiary)]">
            <div className="w-6 sm:w-8 h-px bg-gradient-to-r from-transparent via-[#E07B4F]/20 to-transparent" />
            <span className="text-[var(--color-text-tertiary)]">
              {locale === 'ka' ? 'ყველა სპეციალისტი ნაჩვენებია' : 'All professionals are listed'}
            </span>
            <div className="w-6 sm:w-8 h-px bg-gradient-to-r from-transparent via-[#E07B4F]/20 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
