"use client";

import EmptyState from "@/components/common/EmptyState";
import ProCard from "@/components/common/ProCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SkeletonProCardGrid } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useLikes } from "@/hooks/useLikes";
import { api } from "@/lib/api";
import { LikeTargetType, ProProfile } from "@/types";
import { Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ProfessionalsPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const {
    selectedCategory,
    selectedSubcategory,
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
        if (selectedSubcategory)
          params.append("subcategory", selectedSubcategory);
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

        console.log("profiles", profiles);
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

        setTotalCount(
          pagination.total || result.total || result.totalCount || 0
        );
        setHasMore(
          pagination.hasMore ?? (profiles.length === 12 && profiles.length > 0)
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
      selectedSubcategory,
      minRating,
      searchQuery,
      sortBy,
      selectedCity,
      budgetMin,
      budgetMax,
    ]
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
      if (selectedSubcategory) {
        trackEvent(AnalyticsEvent.SUBCATEGORY_SELECT, {
          category: selectedCategory || undefined,
          subcategory: selectedSubcategory,
        });
      }
    }

    // Update refs and fetch
    prevFiltersRef.current = filterKey;
    hasFetchedRef.current = true;
    setPage(1);
    fetchProfessionals(1, true);
  }, [
    selectedCategory,
    selectedSubcategory,
    minRating,
    searchQuery,
    sortBy,
    selectedCity,
    budgetMin,
    budgetMax,
    fetchProfessionals,
    trackEvent,
  ]);

  // Infinite scroll
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
    <SkeletonProCardGrid count={8} columns={4} className="gap-3 sm:gap-4" />
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
              key={profile.id || `pro-${index}`}
              className="animate-stagger"
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

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="flex justify-center py-6 sm:py-10">
        {isLoadingMore && (
          <div className="flex items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl glass-card">
            <LoadingSpinner size="sm" variant="border" color="#E07B4F" />
            <span className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
              {t('browse.loadingMore')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
