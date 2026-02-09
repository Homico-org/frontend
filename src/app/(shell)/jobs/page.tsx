"use client";

import EmptyState from "@/components/common/EmptyState";
import JobCard from "@/components/common/JobCard";
import MyJobCard from "@/components/common/MyJobCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { api } from "@/lib/api";
import type { Job } from "@/types/shared";
import {
  Bookmark,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
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
      router.replace("/portfolio");
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

  const fetchJobs = useCallback(
    async (pageNum: number, reset = false) => {
      if (!isPro) return;

      try {
        if (reset) setIsLoading(true);
        else setIsLoadingMore(true);

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "12");

        // Pros browse only open jobs; admins should be able to see all jobs (all statuses)
        if (user?.role !== "admin") {
          params.append("status", "open");
        }

        // Filter by pro's selected subcategories only (admins should see ALL jobs)
        if (
          user?.role === "pro" &&
          user?.selectedSubcategories &&
          user.selectedSubcategories.length > 0
        ) {
          user.selectedSubcategories.forEach((sub) => {
            params.append("subcategories", sub);
          });
        }

        if (filters.category) params.append("category", filters.category);
        if (filters.budgetMin !== null)
          params.append("budgetMin", filters.budgetMin.toString());
        if (filters.budgetMax !== null)
          params.append("budgetMax", filters.budgetMax.toString());
        if (filters.propertyType !== "all")
          params.append("propertyType", filters.propertyType);
        if (filters.location !== "all") params.append("location", filters.location);
        if (filters.searchQuery) params.append("search", filters.searchQuery);
        if (filters.deadline !== "all") params.append("deadline", filters.deadline);
        if (filters.showFavoritesOnly) params.append("savedOnly", "true");

        const response = await api.get(`/jobs?${params.toString()}`);
        const data = response.data;
        const jobsList = data.data || data.jobs || [];

        if (reset) setJobs(jobsList);
        else setJobs((prev) => [...prev, ...jobsList]);

        setHasMore(data.pagination?.hasMore ?? jobsList.length === 12);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      isPro,
      user?.selectedSubcategories,
      user?.role,
      filters.category,
      filters.budgetMin,
      filters.budgetMax,
      filters.propertyType,
      filters.location,
      filters.searchQuery,
      filters.deadline,
      filters.showFavoritesOnly,
    ],
  );

  // Fetch user's own posted jobs (regardless of subcategory)
  const fetchMyJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingMyJobs(true);
      const response = await api.get("/jobs/my-jobs?status=open");
      const data = response.data;
      const jobsList = Array.isArray(data) ? data : data.data || data.jobs || [];
      setMyJobs(jobsList.slice(0, 10));
    } catch (error) {
      console.error("Error fetching my jobs:", error);
    } finally {
      setIsLoadingMyJobs(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchMyJobs();
  }, [user?.id, fetchMyJobs]);

  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false);
  const prevFiltersRef = useRef<string | null>(null);

  // Reset and fetch when filters change
  useEffect(() => {
    if (!isPro) return;

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

    if (prevFiltersRef.current === filterKey && hasFetchedRef.current) return;

    const isInitialFetch = !hasFetchedRef.current;
    hasFetchedRef.current = true;
    prevFiltersRef.current = filterKey;

    if (!isInitialFetch) {
      if (filters.searchQuery) {
        trackEvent(AnalyticsEvent.JOB_SEARCH, {
          searchQuery: filters.searchQuery,
          jobCategory: filters.category || undefined,
        });
      }
      if (filters.category) {
        trackEvent(AnalyticsEvent.JOB_FILTER, { jobCategory: filters.category });
      }
    }

    setPage(1);
    fetchJobs(1, true);
  }, [
    isPro,
    filters.category,
    filters.budgetMin,
    filters.budgetMax,
    filters.propertyType,
    filters.location,
    filters.searchQuery,
    filters.deadline,
    filters.showFavoritesOnly,
    fetchJobs,
    trackEvent,
  ]);

  // Infinite scroll
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

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) fetchJobs(page);
  }, [page, fetchJobs]);

  const JobsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200/70 dark:border-neutral-800"
        >
          <div className="aspect-[16/10] sm:aspect-[16/9] bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="p-2.5 sm:p-4">
            <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 animate-pulse mb-2" />
            <div className="h-4 sm:h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-full animate-pulse mb-2" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const JobsEmptyState = () => (
    <EmptyState
      icon={filters.showFavoritesOnly ? Bookmark : Briefcase}
      title={filters.showFavoritesOnly ? "No saved jobs" : "No jobs found"}
      titleKa={
        filters.showFavoritesOnly
          ? "შენახული სამუშაოები არ არის"
          : "სამუშაოები არ მოიძებნა"
      }
      description={
        filters.showFavoritesOnly
          ? "Save jobs by clicking the bookmark icon"
          : "Try adjusting your filters to find more jobs"
      }
      descriptionKa={
        filters.showFavoritesOnly
          ? "შეინახეთ სამუშაოები მონიშვნით"
          : "სცადეთ ფილტრების შეცვლა"
      }
      variant="illustrated"
      size="lg"
    />
  );

  if (isAuthLoading || !isPro) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" variant="border" color={ACCENT_COLOR} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Add Job CTA */}
      <Link
        href="/post-job"
        className="flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#C4735B]/50 hover:bg-[#C4735B]/5 transition-all group"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C4735B]/10 group-hover:bg-[#C4735B]/20 flex items-center justify-center transition-colors">
          <Plus className="w-5 h-5 text-[#C4735B]" />
        </div>
        <div>
          <p className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white group-hover:text-[#C4735B] transition-colors">
            {locale === "ka" ? "სამუშაოს დამატება" : "Post a Job"}
          </p>
          <p className="text-[11px] sm:text-xs text-neutral-400">
            {locale === "ka" ? "იპოვე სპეციალისტი შენი პროექტისთვის" : "Find the right professional for your project"}
          </p>
        </div>
      </Link>

      {/* User's Own Posted Jobs Section */}
      {!filters.showFavoritesOnly && myJobs.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-3 sm:p-4 shadow-sm">
          <button
            onClick={() => setShowMyJobs(!showMyJobs)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#C4735B]/10 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C4735B]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm">
                  {locale === "ka" ? "თქვენი განცხადებები" : "Your Posted Jobs"}
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-400">
                  {myJobs.length} {locale === "ka" ? "აქტიური" : "active"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/post-job"
                onClick={(e) => e.stopPropagation()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#C4735B] bg-[#C4735B]/10 hover:bg-[#C4735B]/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {locale === "ka" ? "ახალი" : "New"}
              </Link>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {showMyJobs ? (
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
                )}
              </div>
            </div>
          </button>

          {showMyJobs && (
            <div className="pt-3 mt-3 sm:pt-4 sm:mt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {myJobs.map((job) => (
                  <MyJobCard key={job.id} job={job} />
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
            {locale === "ka"
              ? "თქვენი სერვისების მიხედვით სამუშაოები არ მოიძებნა"
              : "No jobs found matching your services"}
          </p>
        </div>
      ) : (
        <>
          {/* Section Header */}
          {myJobs.length > 0 && (
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-1 h-4 sm:h-5 rounded-full bg-[#C4735B]" />
                <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white">
                  {locale === "ka" ? "შესაფერისი სამუშაოები" : "Jobs for You"}
                </h3>
                <span className="text-[10px] sm:text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                  {displayedJobs.length}+
                </span>
              </div>
              <span className="hidden sm:block text-xs text-neutral-400">
                {locale === "ka" ? "თქვენი სერვისების მიხედვით" : "Based on your services"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5 items-stretch">
            {displayedJobs.map((job, index) => (
              <div
                key={job.id}
                className="animate-fade-in h-full"
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

          <div ref={loaderRef} className="flex justify-center py-6 sm:py-12">
            {isLoadingMore && (
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
                <LoadingSpinner size="sm" variant="border" color={ACCENT_COLOR} />
                <span className="text-xs sm:text-sm text-neutral-500">
                  {t("common.loading")}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

