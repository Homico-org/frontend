"use client";

import JobCard from "@/components/common/JobCard";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics, AnalyticsEvent } from "@/hooks/useAnalytics";
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
  const loaderRef = useRef<HTMLDivElement>(null);

  // Jobs are filtered on the backend when showFavoritesOnly is true
  const displayedJobs = jobs;

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

  // Fetch jobs with filters - filtered by pro's selected categories/subcategories
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

        // Filter by pro's selected categories (most important filter for pros)
        if (user?.selectedCategories && user.selectedCategories.length > 0) {
          user.selectedCategories.forEach(cat => {
            params.append("categories", cat);
          });
        }

        // Filter by pro's selected subcategories
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

        setHasMore(data.pagination?.hasMore ?? jobsList.length === 12);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isPro, user?.selectedCategories, user?.selectedSubcategories, filters.category, filters.budgetMin, filters.budgetMax, filters.propertyType, filters.location, filters.searchQuery, filters.deadline, filters.showFavoritesOnly]
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

    // Track search/filter events
    if (filters.searchQuery) {
      trackEvent(AnalyticsEvent.JOB_SEARCH, { searchQuery: filters.searchQuery, jobCategory: filters.category || undefined });
    }
    if (filters.category) {
      trackEvent(AnalyticsEvent.JOB_FILTER, { jobCategory: filters.category });
    }

    // For filter changes, reset and fetch
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

  // Illustrated Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      {/* Illustration */}
      <div className="relative mb-8">
        {/* Main illustration container */}
        <div className="w-32 h-32 rounded-3xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center relative overflow-hidden">
          {/* Abstract shapes */}
          <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 rotate-12" />
          <div className="absolute bottom-6 right-4 w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="absolute top-8 right-8 w-4 h-4 rounded bg-neutral-300 dark:bg-neutral-700" />

          {/* Main icon - Briefcase */}
          <svg
            className="w-12 h-12 text-neutral-400 dark:text-neutral-600 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
          style={{ backgroundColor: `${ACCENT_COLOR}20` }}
        />
        <div
          className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full"
          style={{ backgroundColor: `${ACCENT_COLOR}15` }}
        />
      </div>

      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
        {filters.showFavoritesOnly
          ? (locale === "ka" ? "შენახული სამუშაოები არ არის" : "No saved jobs")
          : (locale === "ka" ? "სამუშაოები არ მოიძებნა" : "No jobs found")
        }
      </h3>
      <p className="text-neutral-500 dark:text-neutral-400 text-center max-w-sm">
        {filters.showFavoritesOnly
          ? (locale === "ka" ? "შეინახეთ სამუშაოები მონიშვნით" : "Save jobs by clicking the bookmark icon")
          : (locale === "ka" ? "სცადეთ ფილტრების შეცვლა" : "Try adjusting your filters to find more jobs")
        }
      </p>
    </div>
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
        <EmptyState />
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
