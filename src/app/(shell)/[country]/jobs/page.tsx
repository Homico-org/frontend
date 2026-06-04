"use client";

import JobsFilterBar from "@/components/browse/JobsFilterBar";
import EmptyState from "@/components/common/EmptyState";
import JobCard from "@/components/common/JobCard";
import MyJobCard from "@/components/common/MyJobCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useJobsContext } from "@/contexts/JobsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
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
// URL sync for jobs filters is handled by the sidebar state
import { useCallback, useEffect, useRef, useState } from "react";
import { useCountry } from "@/hooks/useCountry";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/common/PullToRefreshIndicator";
import { addSavedSearch, listSavedSearches } from "@/utils/savedSearches";
import { Bookmark as BookmarkIcon, BookmarkCheck as BookmarkCheckIcon } from "lucide-react";

export default function JobsPage() {
  const { t } = useLanguage();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  // Scope the listing to the marketplace in the URL.
  const country = useCountry();
  const { openLoginModal } = useAuthModal();
  const { trackEvent } = useAnalytics();
  const toast = useToast();
  const { filters, savedJobIds, handleSaveJob, appliedJobIds, clearFilters, hasActiveFilters } = useJobsContext();
  // Filters managed in-memory via JobsContext

  const isPro = user?.role === "pro" || user?.role === "admin";

  // URL sync removed - causes re-render loop with JobsContext defaults

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // User's own posted jobs (only for authenticated users)
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoadingMyJobs, setIsLoadingMyJobs] = useState(false);
  const [showMyJobs, setShowMyJobs] = useState(false);

  const displayedJobs = jobs;

  // Shared abort controller for the latest fetchJobs call. Each new
  // invocation aborts the previous so React Strict Mode's mount-unmount-
  // remount no longer leaves two concurrent `GET /jobs?...` requests
  // racing for the same setJobs. Also kills stale filter-change
  // requests if the user changes a filter mid-fetch.
  const fetchJobsAbortRef = useRef<AbortController | null>(null);
  const fetchJobs = useCallback(
    async (pageNum: number, reset = false) => {
      fetchJobsAbortRef.current?.abort();
      const controller = new AbortController();
      fetchJobsAbortRef.current = controller;
      try {
        if (reset) setIsLoading(true);
        else setIsLoadingMore(true);

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "12");

        // Always show open jobs (admins can see all statuses)
        if (user?.role !== "admin") {
          params.append("status", "open");
        }

        // Apply filters
        if (filters.category) params.append("category", filters.category);
        if (filters.subcategories?.length > 0) {
          params.append("subcategories", filters.subcategories.join(","));
        } else if (filters.subcategory) {
          params.append("subcategories", filters.subcategory);
        }
        if (filters.budgetMin !== null)
          params.append("budgetMin", filters.budgetMin.toString());
        if (filters.budgetMax !== null)
          params.append("budgetMax", filters.budgetMax.toString());
        if (filters.propertyType !== "all")
          params.append("propertyType", filters.propertyType);
        if (filters.location !== "all") params.append("location", filters.location);
        if (filters.searchQuery) params.append("search", filters.searchQuery);
        if (filters.deadline !== "all") params.append("deadline", filters.deadline);
        if (filters.sort && filters.sort !== "newest") params.append("sort", filters.sort);
        if (filters.showFavoritesOnly) params.append("savedOnly", "true");
        // Marketplace scope - sent on every listing call.
        params.append("country", country);

        const response = await api.get(`/jobs?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = response.data;
        const jobsList = data.data || data.jobs || [];

        if (reset) setJobs(jobsList);
        else setJobs((prev) => [...prev, ...jobsList]);

        setHasMore(data.pagination?.hasMore ?? jobsList.length === 12);
      } catch (error) {
        if ((error as { name?: string })?.name === "CanceledError") return;
        if ((error as { code?: string })?.code === "ERR_CANCELED") return;
        console.error("Error fetching jobs:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [
      user?.role,
      filters.category,
      filters.subcategory,
      filters.budgetMin,
      filters.budgetMax,
      filters.propertyType,
      filters.location,
      filters.searchQuery,
      filters.deadline,
      filters.showFavoritesOnly,
      filters.sort,
      filters.subcategories,
      country,
    ],
  );

  // Fetch user's own posted jobs (only for authenticated users)
  const fetchMyJobsAbortRef = useRef<AbortController | null>(null);
  const fetchMyJobs = useCallback(async () => {
    if (!user?.id) return;

    fetchMyJobsAbortRef.current?.abort();
    const controller = new AbortController();
    fetchMyJobsAbortRef.current = controller;
    try {
      setIsLoadingMyJobs(true);
      const response = await api.get("/jobs/my-jobs?status=open", {
        signal: controller.signal,
      });
      const data = response.data;
      const jobsList = Array.isArray(data) ? data : data.data || data.jobs || [];
      setMyJobs(jobsList.slice(0, 10));
    } catch (error) {
      if ((error as { name?: string })?.name === "CanceledError") return;
      if ((error as { code?: string })?.code === "ERR_CANCELED") return;
      console.error("Error fetching my jobs:", error);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingMyJobs(false);
      }
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
    // Wait for auth to finish before first fetch (to know role/subcategories)
    if (isAuthLoading) return;

    const filterKey = JSON.stringify({
      category: filters.category,
      subcategory: filters.subcategory,
      subcategories: filters.subcategories,
      budgetMin: filters.budgetMin,
      budgetMax: filters.budgetMax,
      propertyType: filters.propertyType,
      location: filters.location,
      searchQuery: filters.searchQuery,
      deadline: filters.deadline,
      showFavoritesOnly: filters.showFavoritesOnly,
      sort: filters.sort,
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
    isAuthLoading,
    filters.category,
    filters.subcategory,
    filters.subcategories,
    filters.budgetMin,
    filters.budgetMax,
    filters.propertyType,
    filters.location,
    filters.searchQuery,
    filters.deadline,
    filters.showFavoritesOnly,
    filters.sort,
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

  // Auto-refresh on tab return so a user who switched away doesn't
  // see stale results. Throttled to 30s in the hook to avoid thrash.
  // `reset: true` is critical here - without it, `setJobs` appends
  // page 1 to the existing list and the user sees their first 12
  // cards duplicated below themselves on every focus return.
  useRefreshOnFocus(() => fetchJobs(1, true));

  // Pull-down-to-refresh on mobile. Hook is touch-only so desktop
  // browsers get nothing (and the browser's native refresh stays
  // intact). Returns gesture state for the indicator. Same `reset`
  // requirement as the focus refresh above - without it, every
  // pull duplicated the visible cards.
  const pullState = usePullToRefresh({ onRefresh: () => fetchJobs(1, true) });

  const handleSaveCurrentSearch = () => {
    const baseParts: string[] = [];
    if (filters.searchQuery) baseParts.push(`"${filters.searchQuery}"`);
    if (filters.category) baseParts.push(filters.category);
    if (filters.showFavoritesOnly) baseParts.push(t("job.savedJobs"));
    const defaultLabel = baseParts.length > 0 ? baseParts.join(" · ") : t("nav.jobs");
    const customLabel = typeof window !== "undefined"
      ? window.prompt(t("commandPalette.saveSearchPrompt"), defaultLabel)
      : defaultLabel;
    if (customLabel === null) return;
    const queryStr = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
    addSavedSearch({
      label: customLabel.trim() || defaultLabel,
      surface: "jobs",
      country,
      query: queryStr,
    });
    toast.success(t("commandPalette.searchSaved"));
  };

  // Handle save - require auth. Capture the current URL so the user
  // returns to the same filtered jobs list (with scroll position via
  // sessionStorage) after signing in, instead of bouncing to `/`.
  const onSaveJob = useCallback((jobId: string) => {
    if (!isAuthenticated) {
      const returnTo =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : undefined;
      openLoginModal(returnTo);
      return;
    }
    handleSaveJob(jobId);
  }, [isAuthenticated, openLoginModal, handleSaveJob]);

  const JobsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)]"
        >
          <div className="aspect-[16/10] sm:aspect-[16/9] bg-[var(--hm-bg-tertiary)] animate-pulse" />
          <div className="p-2.5 sm:p-4">
            <div className="h-3 sm:h-4 bg-[var(--hm-bg-tertiary)] rounded w-1/3 animate-pulse mb-2" />
            <div className="h-4 sm:h-5 bg-[var(--hm-bg-tertiary)] rounded w-full animate-pulse mb-2" />
            <div className="h-3 bg-[var(--hm-bg-tertiary)] rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const JobsEmptyState = () => (
    <EmptyState
      icon={filters.showFavoritesOnly ? Bookmark : Briefcase}
      title={filters.showFavoritesOnly ? t("browse.noSavedJobs") : t("browse.noJobsFound")}
      description={
        filters.showFavoritesOnly
          ? t("browse.noSavedJobsDescription")
          : t("browse.noJobsFoundDescription")
      }
      variant="illustrated"
      size="lg"
      // Only surface "Clear filters" when the user has narrowed
      // results themselves - otherwise we'd be inviting them to
      // clear a default state, which is confusing.
      actionLabel={hasActiveFilters ? t("browse.clearFilters") : undefined}
      onAction={hasActiveFilters ? clearFilters : undefined}
    />
  );

  // Show loading while auth initializes (only brief)
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" variant="border" color={ACCENT_COLOR} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <PullToRefreshIndicator
        pullDistance={pullState.pullDistance}
        canTrigger={pullState.canTrigger}
        isRefreshing={pullState.isRefreshing}
      />
      <JobsFilterBar />
      {hasActiveFilters && (() => {
        const currentQuery = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
        const alreadySaved = listSavedSearches().some(
          (s) => s.surface === "jobs" && s.query === currentQuery,
        );
        return (
          <div className="flex justify-end px-3 sm:px-0 -mt-2">
            <button
              type="button"
              onClick={handleSaveCurrentSearch}
              disabled={alreadySaved}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                alreadySaved
                  ? "text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/8 cursor-default"
                  : "text-[var(--hm-fg-secondary)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/8"
              }`}
            >
              {alreadySaved ? (
                <BookmarkCheckIcon className="w-3.5 h-3.5" />
              ) : (
                <BookmarkIcon className="w-3.5 h-3.5" />
              )}
              {alreadySaved ? t("commandPalette.searchSaved") : t("commandPalette.saveSearch")}
            </button>
          </div>
        );
      })()}

      {/* User's Own Posted Jobs Section - authenticated users only */}
      {isAuthenticated && !filters.showFavoritesOnly && myJobs.length > 0 && (
        // `border-neutral-200/60` was a light-mode-only hardcode that
        // rendered a faint blue-grey line on dark theme. Swapped to the
        // theme-aware `--hm-border-subtle` var so the panel border picks
        // up the right tone in both modes. Same for the background -
        // inlined as a Tailwind utility instead of a `style` prop.
        <div
          className="rounded-xl sm:rounded-2xl border border-[var(--hm-border-subtle)] p-3 sm:p-4 bg-[var(--hm-bg-elevated)]"
          style={{
            boxShadow:
              "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
          }}
        >
          <button
            onClick={() => setShowMyJobs(!showMyJobs)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(239,78,36,0.18) 0%, rgba(239,78,36,0.06) 100%)",
                  boxShadow: "inset 0 0 0 1px rgba(239,78,36,0.18)",
                }}
              >
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--hm-brand-500)]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-[var(--hm-fg-primary)] text-xs sm:text-sm">
                  {t("browse.yourPostedJobs")}
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--hm-fg-muted)]">
                  {myJobs.length} {t("job.active").toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href={`/${country.toLowerCase()}/post-job`}
                onClick={(e) => e.stopPropagation()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 hover:bg-[var(--hm-brand-500)]/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("browse.newest")}
              </Link>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
                {showMyJobs ? (
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--hm-fg-muted)]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--hm-fg-muted)]" />
                )}
              </div>
            </div>
          </button>

          {showMyJobs && (
            <div className="pt-3 mt-3 sm:pt-4 sm:mt-4 border-t border-[var(--hm-border-subtle)]">
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
        <div className="text-center py-12 text-[var(--hm-fg-muted)]">
          <p className="text-sm">
            {t("browse.noMatchingJobs")}
          </p>
        </div>
      ) : (
        <>
          {/* Section Header - only shown when my jobs section is visible above */}
          {isAuthenticated && myJobs.length > 0 && isPro && (
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[var(--hm-border-subtle)] mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-1 h-4 sm:h-5 rounded-full bg-[var(--hm-brand-500)]" />
                <h3 className="font-semibold text-sm sm:text-base text-[var(--hm-fg-primary)]">
                  {t("browse.jobsForYou")}
                </h3>
                <span className="text-[10px] sm:text-xs text-[var(--hm-fg-muted)] bg-[var(--hm-bg-tertiary)] px-1.5 sm:px-2 py-0.5 rounded-full">
                  {displayedJobs.length}+
                </span>
              </div>
              <span className="hidden sm:block text-xs text-[var(--hm-fg-muted)]">
                {t("browse.basedOnServices")}
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
                  onSave={onSaveJob}
                  isSaved={savedJobIds.has(job.id)}
                  hasApplied={appliedJobIds.has(job.id)}
                />
              </div>
            ))}
          </div>

          <div ref={loaderRef} className="flex justify-center py-6 sm:py-12">
            {isLoadingMore && (
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[var(--hm-bg-tertiary)]">
                <LoadingSpinner size="sm" variant="border" color={ACCENT_COLOR} />
                <span className="text-xs sm:text-sm text-[var(--hm-fg-muted)]">
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
