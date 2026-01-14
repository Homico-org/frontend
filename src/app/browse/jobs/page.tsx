"use client";

import EmptyState from "@/components/common/EmptyState";
import JobCard from "@/components/common/JobCard";
import MyJobCard from "@/components/common/MyJobCard";
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonCardGrid } from '@/components/ui/Skeleton';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from "@/contexts/AuthContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { api } from "@/lib/api";
import type { Job } from "@/types/shared";
import { Bookmark, Briefcase, ChevronDown, ChevronUp, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function JobsPage() {
  const { t, locale } = useLanguage();
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

  // User's own posted jobs
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoadingMyJobs, setIsLoadingMyJobs] = useState(true);
  const [showMyJobs, setShowMyJobs] = useState(true);

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

        const response = await api.get(`/jobs?${params.toString()}`);
        const data = response.data;
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

  // Fetch user's own posted jobs (regardless of subcategory)
  const fetchMyJobs = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingMyJobs(true);
      const response = await api.get('/jobs/my-jobs?status=open');
      const data = response.data;
      // API returns array directly, or wrapped in data/jobs property
      const jobsList = Array.isArray(data) ? data : (data.data || data.jobs || []);
      setMyJobs(jobsList.slice(0, 10)); // Limit to 10 jobs
    } catch (error) {
      console.error("Error fetching my jobs:", error);
    } finally {
      setIsLoadingMyJobs(false);
    }
  }, [user?.id]);

  // Fetch user's own jobs on mount
  useEffect(() => {
    if (user?.id) {
      fetchMyJobs();
    }
  }, [user?.id, fetchMyJobs]);

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
    <SkeletonCardGrid count={6} columns={4} />
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
        <LoadingSpinner size="lg" variant="border" color={ACCENT_COLOR} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User's Own Posted Jobs Section */}
      {!filters.showFavoritesOnly && myJobs.length > 0 && (
        <div>
          <button
            onClick={() => setShowMyJobs(!showMyJobs)}
            className="w-full flex items-center justify-between py-2 group"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                {locale === 'ka' ? 'თქვენი განცხადებები' : 'Your Posted Jobs'}
              </h3>
              <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                {myJobs.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/post-job"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {locale === 'ka' ? 'ახალი' : 'New'}
              </Link>
              {showMyJobs ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </button>
          
          {showMyJobs && (
            <div className="pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myJobs.map((job) => (
                  <MyJobCard
                    key={job.id}
                    job={job}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Jobs Feed */}
      {isLoading ? (
        <JobsSkeleton />
      ) : displayedJobs.length === 0 && myJobs.length === 0 ? (
        <JobsEmptyState />
      ) : displayedJobs.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p className="text-sm">
            {locale === 'ka' 
              ? 'თქვენი სერვისების მიხედვით სამუშაოები არ მოიძებნა' 
              : 'No jobs found matching your services'}
          </p>
        </div>
      ) : (
        <>
          {/* Section Header */}
          {myJobs.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                {locale === 'ka' ? 'შესაფერისი სამუშაოები' : 'Jobs for You'}
              </h3>
              <span className="text-xs text-neutral-400">
                ({locale === 'ka' ? 'თქვენი სერვისების მიხედვით' : 'based on your services'})
              </span>
            </div>
          )}
          
          {/* Jobs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedJobs.map((job, index) => (
              <div
                key={job.id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
              >
                <JobCard
                  job={job}
                  onSave={handleSaveJob}
                  isSaved={savedJobIds.has(job.id)}
                  hasApplied={appliedJobIds.has(job.id)}
                />
              </div>
            ))}
          </div>

          {/* Infinite scroll loader */}
          <div ref={loaderRef} className="flex justify-center py-12">
            {isLoadingMore && (
              <div className="flex items-center gap-3">
                <LoadingSpinner size="md" variant="border" color={ACCENT_COLOR} />
                <span className="text-sm text-neutral-500">
                  {t('common.loading')}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
