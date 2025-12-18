"use client";

import ProCard from "@/components/common/ProCard";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLikes } from "@/hooks/useLikes";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { LikeTargetType, ProProfile } from "@/types";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";

export default function ProfessionalsPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { selectedCategory, selectedSubcategory, minRating, searchQuery, sortBy, selectedCity } = useBrowseContext();
  const { toggleLike, initializeLikeStates, likeStates } = useLikes();

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

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pro-profiles?${params.toString()}`,
          {
            headers: {
              ...(localStorage.getItem("token") && {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }),
            },
          }
        );

        if (!response.ok) {
          setHasMore(false);
          throw new Error("Failed to fetch");
        }

        const result = await response.json();
        const profiles = result.data || result.profiles || [];
        const pagination = result.pagination || {};

        if (reset) {
          setResults(profiles);
          initializeLikeStates(
            profiles.map((p: ProProfile) => ({
              id: p._id,
              isLiked: p.isLiked || false,
              likeCount: p.likeCount || 0,
            }))
          );
        } else {
          setResults((prev) => [...prev, ...profiles]);
          initializeLikeStates(
            profiles.map((p: ProProfile) => ({
              id: p._id,
              isLiked: p.isLiked || false,
              likeCount: p.likeCount || 0,
            }))
          );
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
    [selectedCategory, selectedSubcategory, minRating, searchQuery, sortBy, selectedCity, initializeLikeStates]
  );

  // Track if initial fetch has been done to prevent double fetching
  const hasFetchedRef = useRef(false);

  // Reset and fetch when filters change
  useEffect(() => {
    // Skip if this is the initial mount and we haven't fetched yet
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setPage(1);
      fetchProfessionals(1, true);
      return;
    }

    // For subsequent filter changes, reset and fetch
    setPage(1);
    fetchProfessionals(1, true);
  }, [selectedCategory, selectedSubcategory, minRating, searchQuery, sortBy, selectedCity, fetchProfessionals]);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="pro-card-modern animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Top section */}
          <div className="flex gap-3 p-3">
            {/* Avatar skeleton */}
            <div className="w-14 h-14 rounded-xl bg-[var(--color-bg-tertiary)]" />
            {/* Info skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-4 rounded w-3/4 bg-[var(--color-bg-tertiary)] mb-1.5" />
              <div className="h-3 rounded w-1/2 bg-[var(--color-bg-tertiary)] mb-2" />
              <div className="flex gap-2">
                <div className="h-3 rounded w-12 bg-[var(--color-bg-tertiary)]" />
                <div className="h-3 rounded w-10 bg-[var(--color-bg-tertiary)]" />
              </div>
            </div>
            {/* Like button skeleton */}
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)]" />
          </div>
          {/* Bottom section */}
          <div className="px-3 pb-3">
            <div className="h-3 rounded w-full bg-[var(--color-bg-tertiary)] mb-1" />
            <div className="h-3 rounded w-2/3 bg-[var(--color-bg-tertiary)] mb-2" />
            <div className="flex gap-1.5">
              <div className="h-5 rounded-md w-16 bg-[var(--color-bg-tertiary)]" />
              <div className="h-5 rounded-md w-14 bg-[var(--color-bg-tertiary)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Premium Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#E07B4F]/10 to-[#E8956A]/5 flex items-center justify-center -rotate-3">
          <svg
            className="w-12 h-12 text-[#E07B4F]/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </div>
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#E07B4F]/20 animate-float-slow" />
        <div className="absolute -bottom-1 -right-3 w-4 h-4 rounded-full bg-[#E8956A]/15 animate-float-slower" />
      </div>

      <h3 className="browse-title text-xl sm:text-2xl text-gradient-terracotta mb-2">
        {locale === "ka" ? "სპეციალისტები არ მოიძებნა" : "No professionals found"}
      </h3>
      <p className="text-sm sm:text-base text-[var(--color-text-secondary)] text-center max-w-md font-serif-italic">
        {locale === "ka"
          ? "სცადეთ სხვა ფილტრები ან კატეგორია სასურველი სპეციალისტის მოსაძებნად"
          : "Try adjusting your filters or explore different categories to find the right professional"}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Results count */}
      {!isLoading && results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            <span className="font-semibold text-[#E07B4F]">{totalCount}</span>
            {' '}
            {locale === 'ka' ? 'სპეციალისტი' : 'professionals'}
          </p>
        </div>
      )}

      {/* Results Grid */}
      {isLoading ? (
        <ProfessionalsSkeleton />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((profile, index) => (
            <div
              key={profile._id}
              className="animate-stagger"
              style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            >
              <ProCard
                profile={{
                  ...profile,
                  isLiked: likeStates[profile._id]?.isLiked ?? profile.isLiked,
                  likeCount: likeStates[profile._id]?.likeCount ?? profile.likeCount,
                }}
                onLike={() => handleProLike(profile._id)}
                showLikeButton={true}
                variant="compact"
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="flex justify-center py-10">
        {isLoadingMore && (
          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl glass-card">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border-2 border-[#E07B4F]/20" />
              <div className="absolute inset-0 rounded-full border-2 border-[#E07B4F] border-t-transparent animate-spin" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {locale === 'ka' ? 'იტვირთება...' : 'Loading more...'}
            </span>
          </div>
        )}
        {!hasMore && results.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)]">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#E07B4F]/20 to-transparent" />
            <span className="font-serif-italic">
              {locale === 'ka' ? 'ყველა სპეციალისტი ნაჩვენებია' : 'All professionals displayed'}
            </span>
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#E07B4F]/20 to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
