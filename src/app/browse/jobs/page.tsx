"use client";

import JobCard from "@/components/common/JobCard";
import { JOB_BUDGET_FILTERS } from "@/components/browse/JobsFiltersSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MediaItem {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: string;
  propertyType?: string;
  areaSize?: number;
  sizeUnit?: string;
  roomCount?: number;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  deadline?: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  images: string[];
  media: MediaItem[];
  proposalCount: number;
  viewCount: number;
  createdAt: string;
  clientId: {
    _id: string;
    name: string;
    avatar?: string;
    city?: string;
    accountType?: "individual" | "organization";
    companyName?: string;
  };
}

export default function JobsPage() {
  const { locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { filters, savedJobIds, handleSaveJob, appliedJobIds } = useJobsContext();

  const isPro = user?.role === "pro";

  // Redirect non-pro users to portfolio page
  useEffect(() => {
    if (!isAuthLoading && !isPro) {
      router.replace("/browse/portfolio");
    }
  }, [isAuthLoading, isPro, router]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Filter jobs by favorites if showFavoritesOnly is true
  const displayedJobs = useMemo(() => {
    if (filters.showFavoritesOnly) {
      return jobs.filter(job => savedJobIds.has(job._id));
    }
    return jobs;
  }, [jobs, filters.showFavoritesOnly, savedJobIds]);

  // Mock images for demo
  const mockImageSets = [
    [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&q=80",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
    ],
    [],
  ];

  // Fetch jobs with filters
  const fetchJobs = useCallback(
    async (pageNum: number, reset = false) => {
      if (!isPro) return;

      try {
        if (reset) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "12");
        params.append("status", "open");

        // Apply category filter
        if (filters.category) {
          params.append("category", filters.category);
        }

        // Apply budget filter
        const budgetFilter = JOB_BUDGET_FILTERS.find(f => f.key === filters.budget);
        if (budgetFilter && filters.budget !== 'all') {
          if (budgetFilter.min !== undefined) params.append("budgetMin", budgetFilter.min.toString());
          if (budgetFilter.max !== undefined) params.append("budgetMax", budgetFilter.max.toString());
        }

        // Apply property type filter
        if (filters.propertyType !== 'all') {
          params.append("propertyType", filters.propertyType);
        }

        // Apply location filter
        if (filters.location !== 'all') {
          params.append("location", filters.location);
        }

        // Apply search filter
        if (filters.searchQuery) {
          params.append("search", filters.searchQuery);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/jobs?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch jobs");

        const data = await response.json();
        let jobsList = data.data || data.jobs || [];

        // Add mock images to jobs for demo purposes
        jobsList = jobsList.map((job: Job, index: number) => {
          if ((!job.images || job.images.length === 0) && (!job.media || job.media.length === 0)) {
            const mockImages = mockImageSets[index % mockImageSets.length];
            return { ...job, images: mockImages };
          }
          return job;
        });

        if (reset) {
          setJobs(jobsList);
        } else {
          setJobs((prev) => [...prev, ...jobsList]);
        }

        setTotalCount(data.pagination?.total || data.total || 0);
        setHasMore(data.pagination?.hasMore ?? jobsList.length === 12);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isPro, filters.category, filters.budget, filters.propertyType, filters.location, filters.searchQuery]
  );

  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false);

  // Reset and fetch when filters change (except showFavoritesOnly which filters client-side)
  useEffect(() => {
    if (!isPro) return;

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setPage(1);
      fetchJobs(1, true);
      return;
    }

    // For filter changes, reset and fetch
    setPage(1);
    fetchJobs(1, true);
  }, [isPro, filters.category, filters.budget, filters.propertyType, filters.location, filters.searchQuery, fetchJobs]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && !filters.showFavoritesOnly) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, filters.showFavoritesOnly]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchJobs(page);
    }
  }, [page, fetchJobs]);

  // Show loading while auth is loading or redirecting non-pro users
  if (isAuthLoading || !isPro) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Results count */}
      {!isLoading && (
        <div className="mb-4 text-sm text-[var(--color-text-secondary)]">
          {filters.showFavoritesOnly ? (
            displayedJobs.length > 0 ? (
              <>
                {locale === 'ka' ? 'შენახული' : 'Saved'}: <span className="font-semibold text-[var(--color-text-primary)]">{displayedJobs.length}</span> {locale === 'ka' ? 'სამუშაო' : 'jobs'}
              </>
            ) : null
          ) : (
            totalCount > 0 ? (
              <>
                {locale === 'ka' ? 'ნაპოვნია' : 'Found'} <span className="font-semibold text-[var(--color-text-primary)]">{totalCount}</span> {locale === 'ka' ? 'სამუშაო' : 'jobs'}
              </>
            ) : null
          )}
        </div>
      )}

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-[20px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-[var(--color-bg-tertiary)]" />
              <div className="p-4 space-y-3">
                <div className="h-4 rounded-lg w-3/4 bg-[var(--color-bg-tertiary)]" />
                <div className="h-3 rounded w-full bg-[var(--color-bg-tertiary)]/50" />
                <div className="h-3 rounded w-2/3 bg-[var(--color-bg-tertiary)]/50" />
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-bg-tertiary)]" />
                  <div className="flex-1">
                    <div className="h-3 rounded w-20 bg-[var(--color-bg-tertiary)] mb-1" />
                    <div className="h-2.5 rounded w-16 bg-[var(--color-bg-tertiary)]/50" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedJobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedJobs.map((job, index) => (
            <div
              key={job._id}
              className="animate-fade-in"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              <JobCard
                job={job}
                onSave={handleSaveJob}
                isSaved={savedJobIds.has(job._id)}
                hasApplied={appliedJobIds.has(job._id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[var(--color-bg-tertiary)]"
          >
            <svg
              className="w-8 h-8 text-[var(--color-text-tertiary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
            {filters.showFavoritesOnly
              ? (locale === "ka" ? "შენახული სამუშაოები არ არის" : "No saved jobs")
              : (locale === "ka" ? "სამუშაოები არ მოიძებნა" : "No jobs found")
            }
          </h3>
          <p className="text-[var(--color-text-secondary)]">
            {filters.showFavoritesOnly
              ? (locale === "ka" ? "შეინახეთ სამუშაოები მონიშვნით" : "Save jobs by clicking the bookmark icon")
              : (locale === "ka" ? "სცადეთ ფილტრების შეცვლა" : "Try adjusting your filters")
            }
          </p>
        </div>
      )}

      {/* Infinite scroll loader */}
      {!filters.showFavoritesOnly && (
        <div ref={loaderRef} className="py-10">
          {isLoadingMore && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E07B4F] border-t-transparent" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
