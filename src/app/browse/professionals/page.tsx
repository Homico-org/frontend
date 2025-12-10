"use client";

import ProCard from "@/components/common/ProCard";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLikes } from "@/hooks/useLikes";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { LikeTargetType, ProProfile } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function ProfessionalsPage() {
  const { t, locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedCategory, selectedSubcategory, minRating } = useBrowseContext();
  const { toggleLike, initializeLikeStates, likeStates } = useLikes();

  const [results, setResults] = useState<ProProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (value: string, callback: (v: string) => void) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(value), 300);
    };
  }, []);

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
          // Stop infinite scroll on error
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
        // Use pagination.hasMore if available, otherwise fallback to checking length
        setHasMore(pagination.hasMore ?? (profiles.length === 12 && profiles.length > 0));
      } catch (error) {
        console.error("Error fetching professionals:", error);
        // Stop infinite scroll on any error
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCategory, selectedSubcategory, minRating, searchQuery, initializeLikeStates]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchProfessionals(1, true);
  }, [selectedCategory, selectedSubcategory, minRating, searchQuery]);

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
  }, [page]);

  const handleProLike = async (proId: string) => {
    if (!user) return;
    await toggleLike(LikeTargetType.PRO_PROFILE, proId);
  };

  return (
    <>
      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4 sm:p-5 animate-pulse"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div
                  className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl"
                  style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                />
                <div className="flex-1">
                  <div
                    className="h-5 rounded-lg w-3/4 mb-2"
                    style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                  />
                  <div
                    className="h-4 rounded-lg w-1/2"
                    style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                  />
                </div>
              </div>
              <div
                className="h-4 rounded-lg w-full mb-2"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              />
              <div
                className="h-4 rounded-lg w-2/3"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {results.map((profile, index) => (
            <div
              key={profile._id}
              className="animate-fade-in"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
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
        <div className="text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-bg-tertiary)" }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: "var(--color-text-tertiary)" }}
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
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {locale === "ka" ? "სპეციალისტები არ მოიძებნა" : "No professionals found"}
          </h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ka" ? "სცადეთ სხვა ფილტრები" : "Try adjusting your filters"}
          </p>
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="py-10">
        {isLoadingMore && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
          </div>
        )}
      </div>
    </>
  );
}
