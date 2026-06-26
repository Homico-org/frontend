"use client";

import ServiceBookingModal from "@/components/booking/ServiceBookingModal";
import ClientActivationCard from "@/components/dashboard/ClientActivationCard";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCountry } from "@/hooks/useCountry";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/common/PullToRefreshIndicator";
import { useToast } from "@/contexts/ToastContext";
import { addSavedSearch, listSavedSearches } from "@/utils/savedSearches";
import { getScrollParent } from "@/utils/scrollUtils";
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
    partnersOnly,
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
  // Quality floor: by default browse hides empty-shell profiles (no work, no
  // pricing, no reviews) so a first-time client sees hireable pros, not a wall
  // of blanks. "Show all" lifts the floor.
  const [showAll, setShowAll] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Scroll position saved by ProCard on click. Applied only once the
  // restored list has rendered - scrolling on mount (the old 100ms
  // setTimeout) clamped to the top because only the first 12 results
  // existed in the document at that point. The shell scrolls inside an
  // overflow-y-auto <main>, not the window, so the restore targets the
  // real scroll container (same logic as the save in ProCard).
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingScrollYRef = useRef<number | null>(null);
  useEffect(() => {
    if (isLoading || results.length === 0) return;
    if (pendingScrollYRef.current === null) return;
    const y = pendingScrollYRef.current;
    pendingScrollYRef.current = null;
    requestAnimationFrame(() => {
      const scrollParent = getScrollParent(rootRef.current);
      if (scrollParent) scrollParent.scrollTop = y;
      else window.scrollTo(0, y);
    });
  }, [isLoading, results.length]);

  // Shared abort controller for the latest fetchProfessionals call.
  // Each new invocation aborts the previous so React Strict Mode no
  // longer leaves two concurrent `GET /users/pros?...` requests racing
  // for the same setResults. Also kills stale filter-change requests
  // if the user changes a filter mid-fetch.
  const fetchProsAbortRef = useRef<AbortController | null>(null);

  // Grouped-random ordering seed. The backend shuffles the default
  // "recommended" list randomly WITHIN each priority tier (partner → featured →
  // premium → portfolio) using this seed. We keep ONE seed for the whole browse
  // (passed on every page) so pagination stays consistent, generate a fresh one
  // on each visit/refresh (new order), and reuse the saved seed on back-
  // navigation so the restored list matches what the user just saw.
  const browseSeedRef = useRef<number | null>(null);
  const getBrowseSeed = useCallback(() => {
    if (browseSeedRef.current != null) return browseSeedRef.current;
    let seed: number | null = null;
    if (typeof window !== "undefined") {
      try {
        const navType = (
          performance.getEntriesByType(
            "navigation",
          )[0] as PerformanceNavigationTiming | undefined
        )?.type;
        if (navType === "back_forward") {
          const raw = sessionStorage.getItem("browseSeed");
          if (raw) seed = parseInt(raw, 10);
        }
      } catch {
        /* ignore */
      }
      if (seed == null || !Number.isFinite(seed)) {
        seed = Math.floor(Math.random() * 1_000_000_000);
      }
      try {
        sessionStorage.setItem("browseSeed", String(seed));
      } catch {
        /* ignore */
      }
    } else {
      seed = 0;
    }
    browseSeedRef.current = seed;
    return seed;
  }, []);

  // Force a brand-new browse seed (new grouped-random order). Desktop gets this
  // for free on a full reload (the component remounts and browseSeedRef resets),
  // but mobile pull-to-refresh only refetches in place — getBrowseSeed would
  // return the cached in-memory seed, so the list never reshuffled. Call this
  // before a pull-to-refresh fetch so mobile matches the desktop reload.
  const resetBrowseSeed = useCallback(() => {
    const seed = Math.floor(Math.random() * 1_000_000_000);
    browseSeedRef.current = seed;
    try {
      sessionStorage.setItem("browseSeed", String(seed));
    } catch {
      /* ignore */
    }
    return seed;
  }, []);

  const fetchProfessionals = useCallback(
    async (pageNum: number, reset = false, fetchLimit = 12) => {
      fetchProsAbortRef.current?.abort();
      const controller = new AbortController();
      fetchProsAbortRef.current = controller;
      try {
        if (reset) setIsLoading(true);
        else setIsLoadingMore(true);

        const params = new URLSearchParams();
        params.append("page", pageNum.toString());
        params.append("limit", fetchLimit.toString());

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
        // Default to hireable pros only (quality floor); "Show all" lifts it.
        if (!showAll) params.append("completeOnly", "true");
        // "Homico Partner" filter: only the bookable, contracted pros.
        if (partnersOnly) params.append("partnersOnly", "true");
        // Seed for grouped-random ordering of the default "recommended" sort.
        // Same seed across pages = consistent pagination; backend ignores it
        // for explicit sorts (rating/price/newest).
        params.append("seed", getBrowseSeed().toString());

        const response = await api.get(`/users/pros?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = response.data;
        const profiles = result.data as ProProfile[];
        const pagination = result.pagination || {};

        if (reset) setResults(profiles);
        else setResults((prev) => [...prev, ...profiles]);

        setHasMore(
          pagination.hasMore ??
            (profiles.length === fetchLimit && profiles.length > 0),
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
      showAll,
      partnersOnly,
      getBrowseSeed,
    ],
  );

  const hasFetchedRef = useRef(false);
  const prevFiltersRef = useRef<string | null>(null);
  // Page whose fetch the page-effect below must skip: set when the restore
  // path already fetched pages 1..N itself in a single request.
  const skipFetchForPageRef = useRef<number | null>(null);

  // Signature of the active filter set. Doubles as the guard key for the
  // saved pagination state - restoring depth for a different filter combo
  // would rebuild the wrong results.
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        selectedCategory,
        selectedSubcategories,
        minRating,
        searchQuery,
        sortBy,
        selectedCity,
        budgetMin,
        budgetMax,
        country,
        showAll,
        partnersOnly,
      }),
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
      showAll,
      partnersOnly,
    ],
  );

  useEffect(() => {
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

    // Back navigation: if the user clicked through to a profile from page N
    // of this exact filter set, rebuild pages 1..N in a single request so
    // the list (and the saved scroll position) can be restored. Without
    // this the remount resets to page 1 and the scroll restore lands at
    // the top of the list.
    if (!hasFetchedRef.current && typeof window !== "undefined") {
      const scrollRaw = sessionStorage.getItem("browseScrollY");
      sessionStorage.removeItem("browseScrollY");
      try {
        const stateRaw = sessionStorage.getItem("browseListState");
        const saved = stateRaw
          ? (JSON.parse(stateRaw) as { page?: number; filterKey?: string })
          : null;
        if (saved?.filterKey === filterKey) {
          if (scrollRaw) pendingScrollYRef.current = parseInt(scrollRaw, 10);
          // Cap the depth so a corrupt value can't trigger a huge query.
          const savedPage = Math.min(saved.page ?? 1, 30);
          if (savedPage > 1) {
            hasFetchedRef.current = true;
            skipFetchForPageRef.current = savedPage;
            setPage(savedPage);
            fetchProfessionals(1, true, savedPage * 12);
            return;
          }
        }
      } catch {
        // Corrupt saved state - fall through to a fresh first page.
      }
    }

    hasFetchedRef.current = true;
    setPage(1);
    fetchProfessionals(1, true);
  }, [
    filterKey,
    selectedCategory,
    selectedSubcategories,
    minRating,
    searchQuery,
    sortBy,
    selectedCity,
    budgetMin,
    budgetMax,
    country,
    showAll,
    partnersOnly,
    fetchProfessionals,
    trackEvent,
  ]);

  // Persist the depth reached for this filter set so the restore branch
  // above can rebuild it on back navigation. sessionStorage keeps it
  // per-tab and drops it when the tab closes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
      "browseListState",
      JSON.stringify({ page, filterKey }),
    );
  }, [page, filterKey]);

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

  const prevPageRef = useRef(1);
  useEffect(() => {
    const prevPage = prevPageRef.current;
    prevPageRef.current = page;
    // Also re-runs when `fetchProfessionals` changes identity (filter
    // change); only fetch when the page number itself moved, otherwise a
    // stale page > 1 would append old-depth results onto fresh filters.
    if (page === prevPage || page <= 1) return;
    if (skipFetchForPageRef.current === page) {
      // Restore path already fetched pages 1..N in a single request.
      skipFetchForPageRef.current = null;
      return;
    }
    fetchProfessionals(page);
  }, [page, fetchProfessionals]);

  // Refetch on tab return so stale data doesn't trick users into
  // contacting pros who've gone offline since the last load. Resetting
  // `page` too keeps the infinite-scroll cursor in sync with the single
  // page now displayed.
  useRefreshOnFocus(() => {
    setPage(1);
    fetchProfessionals(1, true);
  });

  // Pull-down-to-refresh on mobile. Hook is touch-only. Reshuffle the
  // grouped-random order on each pull, mirroring a desktop browser reload —
  // without resetting the seed the in-place refetch reuses the cached seed and
  // the leaderboard never changes on mobile.
  const pullState = usePullToRefresh({
    onRefresh: () => {
      resetBrowseSeed();
      setPage(1);
      return fetchProfessionals(1, true);
    },
  });

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
    <div ref={rootRef} className="space-y-2 sm:space-y-3">
      <PullToRefreshIndicator
        pullDistance={pullState.pullDistance}
        canTrigger={pullState.canTrigger}
        isRefreshing={pullState.isRefreshing}
      />
      <BrowseFilterBar />
      {/* Fresh-client activation banner - browse is where clients land after
          signup, so this is the surface most likely to catch them before they
          bounce. Slim + dismissible; self-hides once they have any activity. */}
      <ClientActivationCard variant="banner" />
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

      {/* Quality-floor escape hatch. By default browse hides empty-shell
          profiles so the first impression is hireable pros; this lets a user
          reveal everyone (and explains why some are hidden). */}
      {!isLoading && (
        <div className="flex justify-center pb-8">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[12px] font-medium text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-brand-500)]"
          >
            {showAll
              ? pick({
                  en: "Showing everyone · Show complete profiles only",
                  ka: "ნაჩვენებია ყველა · მხოლოდ შევსებული პროფილები",
                  ru: "Показаны все · Только заполненные профили",
                })
              : pick({
                  en: "Some pros are hidden until they complete their profile · Show all",
                  ka: "ზოგი ოსტატი დამალულია პროფილის შევსებამდე · ყველას ჩვენება",
                  ru: "Часть мастеров скрыта до заполнения профиля · Показать всех",
                })}
          </button>
        </div>
      )}

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
