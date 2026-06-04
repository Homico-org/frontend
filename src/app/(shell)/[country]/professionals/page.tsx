"use client";

import ServiceBookingModal from "@/components/booking/ServiceBookingModal";
import EmptyState from "@/components/common/EmptyState";
import ProCard from "@/components/common/ProCard";
import BrowseFilterBar from "@/components/browse/BrowseFilterBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { useLikes } from "@/hooks/useLikes";
import { api } from "@/lib/api";
import { LikeTargetType, ProProfile } from "@/types";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCountry } from "@/hooks/useCountry";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/common/PullToRefreshIndicator";
import { useToast } from "@/contexts/ToastContext";
import { addSavedSearch, listSavedSearches } from "@/utils/savedSearches";
import { Bookmark as BookmarkIcon, BookmarkCheck as BookmarkCheckIcon } from "lucide-react";

export default function ProfessionalsPage() {
  const { t, pick } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  // Scope the listing to the marketplace in the URL. Defaults to "GE"
  // for any consumer rendered outside a `[country]` segment.
  const country = useCountry();
  const { trackEvent } = useAnalytics();
  const {
    selectedCategory,
    selectedSubcategories,
    minRating,
    searchQuery,
    sortBy,
    selectedCity,
    budgetMin,
    budgetMax,
    clearAllFilters,
    hasActiveFilters,
  } = useBrowseContext();
  const { toggleLike } = useLikes();

  const [results, setResults] = useState<ProProfile[]>([]);
  // Pro selected for the shared booking modal - opened from a ProCard's Book CTA.
  const [bookingPro, setBookingPro] = useState<ProProfile | null>(null);
  const handleBook = useCallback(
    (profile: ProProfile) => {
      if (!isAuthenticated) {
        openLoginModal();
        return;
      }
      setBookingPro(profile);
    },
    [isAuthenticated, openLoginModal],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on back navigation
  useEffect(() => {
    const saved = sessionStorage.getItem('browseScrollY');
    if (saved) {
      const y = parseInt(saved, 10);
      sessionStorage.removeItem('browseScrollY');
      setTimeout(() => window.scrollTo(0, y), 100);
    }
  }, []);

  // Shared abort controller for the latest fetchProfessionals call.
  // Each new invocation aborts the previous so React Strict Mode no
  // longer leaves two concurrent `GET /users/pros?...` requests racing
  // for the same setResults. Also kills stale filter-change requests
  // if the user changes a filter mid-fetch.
  const fetchProsAbortRef = useRef<AbortController | null>(null);
  const fetchProfessionals = useCallback(
    async (pageNum: number, reset = false) => {
      fetchProsAbortRef.current?.abort();
      const controller = new AbortController();
      fetchProsAbortRef.current = controller;
      try {
        if (reset) setIsLoading(true);
        else setIsLoadingMore(true);

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", "12");

        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedSubcategories.length > 0)
          params.append("subcategories", selectedSubcategories.join(","));
        if (minRating > 0) params.append("minRating", minRating.toString());
        if (searchQuery) params.append("search", searchQuery);
        if (sortBy && sortBy !== "recommended") params.append("sort", sortBy);
        if (selectedCity && selectedCity !== "all")
          params.append("serviceArea", selectedCity);
        if (budgetMin !== null) params.append("minPrice", budgetMin.toString());
        if (budgetMax !== null) params.append("maxPrice", budgetMax.toString());
        // Marketplace scope - sent on every listing call so the backend
        // returns only pros from this country.
        params.append("country", country);

        const response = await api.get(`/users/pros?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = response.data;
        const profiles = result.data as ProProfile[];
        const pagination = result.pagination || {};

        if (reset) setResults(profiles);
        else setResults((prev) => [...prev, ...profiles]);

        setHasMore(
          pagination.hasMore ?? (profiles.length === 12 && profiles.length > 0),
        );
      } catch (error) {
        if ((error as { name?: string })?.name === "CanceledError") return;
        if ((error as { code?: string })?.code === "ERR_CANCELED") return;
        console.error("Error fetching professionals:", error);
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [
      selectedCategory,
      selectedSubcategories,
      minRating,
      searchQuery,
      sortBy,
      selectedCity,
      budgetMin,
      budgetMax,
      country,
    ],
  );

  const hasFetchedRef = useRef(false);
  const prevFiltersRef = useRef<string | null>(null);

  useEffect(() => {
    const filterKey = JSON.stringify({
      selectedCategory,
      selectedSubcategories,
      minRating,
      searchQuery,
      sortBy,
      selectedCity,
      budgetMin,
      budgetMax,
      country,
    });

    if (prevFiltersRef.current === filterKey && hasFetchedRef.current) return;

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
      if (selectedSubcategories.length > 0) {
        trackEvent(AnalyticsEvent.SUBCATEGORY_SELECT, {
          category: selectedCategory || undefined,
          subcategory: selectedSubcategories.join(","),
        });
      }
    }

    prevFiltersRef.current = filterKey;
    hasFetchedRef.current = true;
    setPage(1);
    fetchProfessionals(1, true);
  }, [
    selectedCategory,
    selectedSubcategories,
    minRating,
    searchQuery,
    sortBy,
    selectedCity,
    budgetMin,
    budgetMax,
    country,
    fetchProfessionals,
    trackEvent,
  ]);

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
      { threshold: 0.1 },
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  useEffect(() => {
    if (page > 1) fetchProfessionals(page);
  }, [page, fetchProfessionals]);

  // Refetch on tab return so stale data doesn't trick users into
  // contacting pros who've gone offline since the last load.
  useRefreshOnFocus(() => fetchProfessionals(1, true));

  // Pull-down-to-refresh on mobile. Hook is touch-only.
  const pullState = usePullToRefresh({ onRefresh: () => fetchProfessionals(1, true) });

  const toast = useToast();
  const handleSaveCurrentSearch = () => {
    // Auto-derive a label from search query / category - users can
    // re-prompt for a custom name via the prompt() fallback. Anything
    // typed wins; canceling falls back to the auto-derived label.
    const baseParts: string[] = [];
    if (searchQuery) baseParts.push(`"${searchQuery}"`);
    if (selectedCategory) baseParts.push(selectedCategory);
    if (minRating > 0) baseParts.push(`${minRating}+★`);
    const defaultLabel = baseParts.length > 0 ? baseParts.join(" · ") : t("browse.professionals");
    const customLabel = typeof window !== "undefined"
      ? window.prompt(t("commandPalette.saveSearchPrompt"), defaultLabel)
      : defaultLabel;
    if (customLabel === null) return; // cancelled
    const queryStr = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
    addSavedSearch({
      label: customLabel.trim() || defaultLabel,
      surface: "professionals",
      country,
      query: queryStr,
    });
    toast.success(t("commandPalette.searchSaved"));
  };

  const handleProLike = async (proId: string) => {
    if (!user) return;
    await toggleLike(LikeTargetType.PRO_PROFILE, proId);
  };

  const ProfessionalsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--hm-bg-elevated)] rounded-xl sm:rounded-2xl overflow-hidden border border-[var(--hm-border-subtle)]"
        >
          <div className="grid grid-cols-3 gap-px aspect-[3/1.15] bg-[var(--hm-bg-tertiary)]">
            {[0, 1, 2].map(j => (
              <div key={j} className="bg-[var(--hm-bg-tertiary)] animate-pulse" />
            ))}
          </div>
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--hm-bg-tertiary)] animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--hm-bg-tertiary)] rounded w-2/3 animate-pulse mb-1.5" />
                <div className="h-3 bg-[var(--hm-bg-tertiary)] rounded w-1/3 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 bg-[var(--hm-bg-tertiary)] rounded-full w-16 animate-pulse" />
              <div className="h-5 bg-[var(--hm-bg-tertiary)] rounded-full w-20 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ProfessionalsEmptyState = () => (
    <EmptyState
      icon={Users}
      title={t("job.noProsFound")}
      description={t("job.noProsFoundBody")}
      variant="illustrated"
      size="lg"
      // Offer "Clear filters" only when the user narrowed themselves
      // into a zero-results corner. Without filters there's nothing
      // to clear; suggesting it would just confuse.
      actionLabel={hasActiveFilters ? t("browse.clearFilters") : undefined}
      onAction={hasActiveFilters ? clearAllFilters : undefined}
    />
  );

  return (
    <div className="space-y-2 sm:space-y-3">
      <PullToRefreshIndicator
        pullDistance={pullState.pullDistance}
        canTrigger={pullState.canTrigger}
        isRefreshing={pullState.isRefreshing}
      />
      <BrowseFilterBar />
      {/* "Save search" affordance - only when filters are active.
          Persists the URL query to localStorage so the combo can
          be re-run from the Cmd+K palette. Flips to a filled
          bookmark + "Saved" label when the current URL already
          matches an existing saved search, so users don't try to
          save the same combo twice. */}
      {hasActiveFilters && (() => {
        const currentQuery = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
        const alreadySaved = listSavedSearches().some(
          (s) => s.surface === "professionals" && s.query === currentQuery,
        );
        return (
          <div className="flex justify-end px-3 sm:px-0">
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
      {/* CTA: Guest → Register as Pro | Client → Post a Job */}
      {!isLoading && results.length > 0 && (
        <>
          {!isAuthenticated && (
            <Link
              href="/register"
              className="group flex items-center justify-between gap-2.5 px-3 py-2.5 sm:p-4 rounded-lg sm:rounded-2xl transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                // Soft accent gradient says "this is a brand CTA, not a
                // utility row". Matches the bookings total card and the
                // post-job hero card so the surfaces feel related.
                background:
                  "linear-gradient(180deg, rgba(239,78,36,0.08) 0%, rgba(239,78,36,0.02) 100%)",
                border: "1px solid rgba(239,78,36,0.20)",
                boxShadow:
                  "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(239,78,36,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(239,78,36,0.20) 0%, rgba(239,78,36,0.08) 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(239,78,36,0.20)",
                  }}
                >
                  <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[var(--hm-brand-500)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] sm:text-base font-semibold text-[var(--hm-fg-primary)] truncate leading-tight">
                    {pick({ en: "Register as a Professional", ka: "დარეგისტრირდით პროფესიონალად" })}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[var(--hm-fg-muted)] truncate">
                    {pick({ en: "Join and start finding clients", ka: "შემოგვიერთდით და იპოვეთ კლიენტები" })}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[var(--hm-brand-500)] flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </>
      )}

      {isLoading ? (
        <ProfessionalsSkeleton />
      ) : results.length > 0 ? (
        <>
        {/* Per-page result count intentionally omitted — it counted the
            currently-loaded slice (12 from infinite scroll), not the true
            total, so users mistook it for "only 12 pros exist". */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 items-start">
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
                activeCategory={selectedCategory || undefined}
                activeSubcategories={selectedSubcategories}
                onBook={handleBook}
              />
            </div>
          ))}
        </div>
        </>
      ) : (
        <ProfessionalsEmptyState />
      )}

      <div ref={loaderRef} className="flex justify-center py-6 sm:py-10">
        {isLoadingMore && (
          <div className="flex items-center gap-3 px-4 py-2 sm:gap-4 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl glass-card">
            <LoadingSpinner size="sm" variant="border" color="var(--hm-brand-500)" />
            <span className="text-xs sm:text-sm font-medium text-[var(--hm-fg-secondary)]">
              {t("browse.loadingMore")}
            </span>
          </div>
        )}
      </div>

      {bookingPro && (
        <ServiceBookingModal
          isOpen={!!bookingPro}
          onClose={() => setBookingPro(null)}
          professional={{
            id: bookingPro.id,
            name: bookingPro.name,
            avatar: bookingPro.avatar,
            servicePricing: bookingPro.servicePricing || [],
          }}
          initialServiceKeys={selectedSubcategories}
        />
      )}
    </div>
  );
}
