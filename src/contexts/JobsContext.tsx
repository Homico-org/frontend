'use client';

import { AnalyticsEvent, trackAnalyticsEvent } from '@/hooks/useAnalytics';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

export interface JobFilters {
  category: string | null;
  subcategory: string | null; // legacy single
  subcategories: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  propertyType: string;
  location: string;
  deadline: string;
  searchQuery: string;
  showFavoritesOnly: boolean;
  sort: string;
}

const DEFAULT_FILTERS: JobFilters = {
  category: null,
  subcategory: null,
  subcategories: [],
  budgetMin: null,
  budgetMax: null,
  propertyType: 'all',
  location: 'all',
  deadline: 'all',
  searchQuery: '',
  showFavoritesOnly: false,
  sort: 'newest',
};

interface JobsContextType {
  filters: JobFilters;
  setFilters: (filters: JobFilters | ((prev: JobFilters) => JobFilters)) => void;
  /** Reset filters back to their defaults (used by empty-state "Clear filters" CTA). */
  clearFilters: () => void;
  /** True if any user-applied filter is currently narrowing results. */
  hasActiveFilters: boolean;
  savedJobIds: Set<string>;
  handleSaveJob: (jobId: string) => void;
  appliedJobIds: Set<string>;
  isLoadingApplied: boolean;
  isLoadingSaved: boolean;
  refreshSavedJobs: () => Promise<void>;
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  // Initialize from URL. Every browse-list-shaped page is
  // deep-linkable - paste the URL into a new tab and see the same
  // filtered list.
  const [filters, setFiltersRaw] = useState<JobFilters>(() => {
    const subcats = searchParams.get('subcategories');
    return {
      ...DEFAULT_FILTERS,
      category: searchParams.get('category'),
      subcategories: subcats ? subcats.split(',').filter(Boolean) : [],
      subcategory: subcats ? subcats.split(',')[0] : null,
      budgetMin: searchParams.has('budgetMin') ? Number(searchParams.get('budgetMin')) : null,
      budgetMax: searchParams.has('budgetMax') ? Number(searchParams.get('budgetMax')) : null,
      propertyType: searchParams.get('propertyType') ?? DEFAULT_FILTERS.propertyType,
      location: searchParams.get('location') ?? DEFAULT_FILTERS.location,
      deadline: searchParams.get('deadline') ?? DEFAULT_FILTERS.deadline,
      searchQuery: searchParams.get('search') ?? '',
      showFavoritesOnly: searchParams.get('saved') === '1',
      sort: searchParams.get('sort') ?? DEFAULT_FILTERS.sort,
    };
  });

  // Wrap setFilters to accept both a value and an updater fn, and sync URL.
  const setFilters = useCallback(
    (update: JobFilters | ((prev: JobFilters) => JobFilters)) => {
      setFiltersRaw((prev) => {
        const next = typeof update === 'function' ? update(prev) : update;
        // Sync URL without triggering React re-render. Native History
        // API sidesteps Next.js router so the provider doesn't reset
        // state each time a filter changes.
        if (typeof window !== 'undefined' && window.location.pathname.includes('/jobs')) {
          const params = new URLSearchParams();
          if (next.category) params.set('category', next.category);
          if (next.subcategories?.length > 0) params.set('subcategories', next.subcategories.join(','));
          if (next.budgetMin !== null) params.set('budgetMin', next.budgetMin.toString());
          if (next.budgetMax !== null) params.set('budgetMax', next.budgetMax.toString());
          if (next.propertyType && next.propertyType !== DEFAULT_FILTERS.propertyType) params.set('propertyType', next.propertyType);
          if (next.location && next.location !== DEFAULT_FILTERS.location) params.set('location', next.location);
          if (next.deadline && next.deadline !== DEFAULT_FILTERS.deadline) params.set('deadline', next.deadline);
          if (next.searchQuery) params.set('search', next.searchQuery);
          if (next.showFavoritesOnly) params.set('saved', '1');
          if (next.sort && next.sort !== DEFAULT_FILTERS.sort) params.set('sort', next.sort);
          const qs = params.toString();
          const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
          const currentUrl = window.location.pathname + window.location.search;
          if (currentUrl !== newUrl) {
            window.history.replaceState(null, '', newUrl);
          }
        }
        return next;
      });
    },
    [],
  );
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isLoadingApplied, setIsLoadingApplied] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const previousUserIdRef = useRef<string | undefined>(undefined);

  // Fetch saved jobs from backend when user changes
  const fetchSavedJobs = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !isAuthenticated) {
      setSavedJobIds(new Set());
      setIsLoadingSaved(false);
      return;
    }

    try {
      setIsLoadingSaved(true);
      const response = await api.get(`/jobs/saved/list`);
      const savedIds = response.data || [];
      setSavedJobIds(new Set(savedIds));
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      setSavedJobIds(new Set());
    } finally {
      setIsLoadingSaved(false);
    }
  }, [isAuthenticated]);

  // Fetch saved jobs when user changes
  useEffect(() => {
    // Only reload if user actually changed
    if (previousUserIdRef.current === user?.id) return;
    previousUserIdRef.current = user?.id;

    if (!user?.id) {
      setSavedJobIds(new Set());
      setIsLoadingSaved(false);
      return;
    }

    fetchSavedJobs();
  }, [user?.id, fetchSavedJobs]);

  // Ref to prevent duplicate fetches (React Strict Mode)
  const appliedFetchedRef = useRef(false);

  // Fetch user's proposals to know which jobs they've applied to
  useEffect(() => {
    // Prevent duplicate fetch in React Strict Mode
    if (appliedFetchedRef.current) return;
    appliedFetchedRef.current = true;

    const fetchAppliedJobs = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoadingApplied(false);
        return;
      }

      try {
        const response = await api.get(`/jobs/my-proposals/list`);
        const data = response.data;
        const proposals = data.data || data.proposals || data || [];
        // Extract job IDs from proposals (handle both _id and id formats from backend)
        const jobIds = new Set<string>(
          proposals
            .map((p: { jobId?: string | { _id?: string; id?: string } }) => {
              if (typeof p.jobId === 'string') return p.jobId;
              if (p.jobId && typeof p.jobId === 'object') {
                return p.jobId.id || p.jobId._id;
              }
              return null;
            })
            .filter(Boolean)
        );
        setAppliedJobIds(jobIds);
      } catch (error) {
        console.error("Error fetching applied jobs:", error);
      } finally {
        setIsLoadingApplied(false);
      }
    };

    fetchAppliedJobs();
  }, []);

  // Handle save/unsave job via backend API
  const handleSaveJob = useCallback((jobId: string) => {
    const token = localStorage.getItem("access_token");
    if (!token || !isAuthenticated) return;

    // Use functional update to get the current saved state and update optimistically
    let wasSaved = false;
    setSavedJobIds((prev) => {
      wasSaved = prev.has(jobId);
      const newSet = new Set(prev);
      if (wasSaved) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });

    // Track save/unsave event
    trackAnalyticsEvent(wasSaved ? AnalyticsEvent.JOB_UNSAVE : AnalyticsEvent.JOB_SAVE, { jobId });

    // Make API call (fire and forget with error handling)
    const makeApiCall = async () => {
      try {
        if (wasSaved) {
          await api.delete(`/jobs/${jobId}/save`);
        } else {
          await api.post(`/jobs/${jobId}/save`);
        }
      } catch (error) {
        console.error("Error saving/unsaving job:", error);
        // Revert optimistic update on error
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          if (wasSaved) {
            newSet.add(jobId);
          } else {
            newSet.delete(jobId);
          }
          return newSet;
        });
      }
    };
    makeApiCall();
  }, [isAuthenticated]);

  // Reset filters back to their initial defaults. Wired to the
  // empty-state "Clear filters" CTA so a user who's narrowed
  // themselves into a zero-results corner has a one-tap escape.
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, [setFilters]);

  const hasActiveFilters =
    filters.category !== null ||
    filters.subcategories.length > 0 ||
    filters.budgetMin !== null ||
    filters.budgetMax !== null ||
    filters.propertyType !== DEFAULT_FILTERS.propertyType ||
    filters.location !== DEFAULT_FILTERS.location ||
    filters.deadline !== DEFAULT_FILTERS.deadline ||
    filters.searchQuery !== '' ||
    filters.showFavoritesOnly ||
    (filters.sort !== DEFAULT_FILTERS.sort && filters.sort !== '');

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    savedJobIds,
    handleSaveJob,
    appliedJobIds,
    isLoadingApplied,
    isLoadingSaved,
    refreshSavedJobs: fetchSavedJobs
  }), [filters, setFilters, clearFilters, hasActiveFilters, savedJobIds, handleSaveJob, appliedJobIds, isLoadingApplied, isLoadingSaved, fetchSavedJobs]);

  return (
    <JobsContext.Provider value={contextValue}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobsContext() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobsContext must be used within a JobsProvider');
  }
  return context;
}
