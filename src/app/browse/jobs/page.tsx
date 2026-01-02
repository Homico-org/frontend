"use client";

import JobCard from "@/components/common/JobCard";
import EmptyState from "@/components/common/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics, AnalyticsEvent } from "@/hooks/useAnalytics";
import { Briefcase, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Terracotta accent
const ACCENT_COLOR = '#C4735B';

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
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const { filters, savedJobIds, handleSaveJob, appliedJobIds } = useJobsContext();

  const isPro = user?.role === "pro" || user?.role === "admin";

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
  const loaderRef = useRef<HTMLDivElement>(null);

  // Jobs are filtered on the backend when showFavoritesOnly is true
  const displayedJobs = jobs;


  // Fetch jobs with filters - filtered by pro's selected subcategories
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

        // Filter by pro's selected subcategories only
        if (user?.selectedSubcategories && user.selectedSubcategories.length > 0) {
          user.selectedSubcategories.forEach(sub => {
            params.append("subcategories", sub);
          });
        }

        // Apply additional category filter from UI (narrows down further)
        if (filters.category) {
          params.append("category", filters.category);
        }

        // Apply budget filter
        if (filters.budgetMin !== null) {
          params.append("budgetMin", filters.budgetMin.toString());
        }
        if (filters.budgetMax !== null) {
          params.append("budgetMax", filters.budgetMax.toString());
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

        // Apply deadline filter
        if (filters.deadline !== 'all') {
          params.append("deadline", filters.deadline);
        }

        // Apply favorites filter - backend will filter to saved jobs only
        if (filters.showFavoritesOnly) {
          params.append("savedOnly", "true");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/jobs?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch jobs");

        const data = await response.json();
        const jobsList = data.data || data.jobs || [];

        if (reset) {
          setJobs(jobsList);
        } else {
          setJobs((prev) => [...prev, ...jobsList]);
        }

        setHasMore(data.pagination?.hasMore ?? jobsList.length === 12);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isPro, user?.selectedSubcategories, filters.category, filters.budgetMin, filters.budgetMax, filters.propertyType, filters.location, filters.searchQuery, filters.deadline, filters.showFavoritesOnly]
  );

  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false);
  // Track previous filter values to detect actual changes
  const prevFiltersRef = useRef<string | null>(null);

  // Reset and fetch when filters change
  useEffect(() => {
    if (!isPro) return;

    // Create a stable filter key to detect actual changes
    const filterKey = JSON.stringify({
      category: filters.category,
      budgetMin: filters.budgetMin,
      budgetMax: filters.budgetMax,
      propertyType: filters.propertyType,
      location: filters.location,
      searchQuery: filters.searchQuery,
      deadline: filters.deadline,
      showFavoritesOnly: filters.showFavoritesOnly,
    });

    // Skip if filters haven't actually changed (prevents duplicate fetches)
    if (prevFiltersRef.current === filterKey && hasFetchedRef.current) {
      return;
    }

    const isInitialFetch = !hasFetchedRef.current;
    hasFetchedRef.current = true;
    prevFiltersRef.current = filterKey;

    // Track search/filter events (only on filter changes, not initial load)
    if (!isInitialFetch) {
      if (filters.searchQuery) {
        trackEvent(AnalyticsEvent.JOB_SEARCH, { searchQuery: filters.searchQuery, jobCategory: filters.category || undefined });
      }
      if (filters.category) {
        trackEvent(AnalyticsEvent.JOB_FILTER, { jobCategory: filters.category });
      }
    }

    setPage(1);
    fetchJobs(1, true);
  }, [isPro, filters.category, filters.budgetMin, filters.budgetMax, filters.propertyType, filters.location, filters.searchQuery, filters.deadline, filters.showFavoritesOnly, fetchJobs, trackEvent]);

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
      fetchJobs(page);
    }
  }, [page, fetchJobs]);

  // Skeleton loading - Grid style
  const JobsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800" />
          <div className="p-4 space-y-3">
            <div className="h-5 rounded-lg w-3/4 bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-3 rounded w-full bg-neutral-100 dark:bg-neutral-800" />
            <div className="h-3 rounded w-2/3 bg-neutral-100 dark:bg-neutral-800" />
            <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800" />
              <div className="flex-1">
                <div className="h-3 rounded w-20 bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state using shared component
  const JobsEmptyState = () => (
    <EmptyState
      icon={filters.showFavoritesOnly ? Bookmark : Briefcase}
      title={filters.showFavoritesOnly ? "No saved jobs" : "No jobs found"}
      titleKa={filters.showFavoritesOnly ? "შენახული სამუშაოები არ არის" : "სამუშაოები არ მოიძებნა"}
      description={filters.showFavoritesOnly ? "Save jobs by clicking the bookmark icon" : "Try adjusting your filters to find more jobs"}
      descriptionKa={filters.showFavoritesOnly ? "შეინახეთ სამუშაოები მონიშვნით" : "სცადეთ ფილტრების შეცვლა"}
      variant="illustrated"
      size="lg"
    />
  );

  // Show loading while auth is loading or redirecting non-pro users
  if (isAuthLoading || !isPro) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div>
      {isLoading ? (
        <JobsSkeleton />
      ) : displayedJobs.length === 0 ? (
        <JobsEmptyState />
      ) : (
        <>
          {/* Jobs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedJobs.map((job, index) => (
              <div
                key={job._id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
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

          {/* Infinite scroll loader */}
          <div ref={loaderRef} className="flex justify-center py-12">
            {isLoadingMore && (
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: ACCENT_COLOR, borderTopColor: 'transparent' }}
                />
                <span className="text-sm text-neutral-500">
                  {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
