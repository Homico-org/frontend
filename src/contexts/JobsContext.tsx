'use client';

import { AnalyticsEvent, trackAnalyticsEvent } from '@/hooks/useAnalytics';
import api from '@/lib/api';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

export interface JobFilters {
  category: string | null;
  subcategory: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  propertyType: string;
  location: string;
  deadline: string;
  searchQuery: string;
  showFavoritesOnly: boolean;
}

const DEFAULT_FILTERS: JobFilters = {
  category: null,
  subcategory: null,
  budgetMin: null,
  budgetMax: null,
  propertyType: 'all',
  location: 'all',
  deadline: 'all',
  searchQuery: '',
  showFavoritesOnly: false,
};

interface JobsContextType {
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
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
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
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
      const response = await api.ge`/jobs/saved/list`;
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
        const response = await api.ge`/jobs/my-proposals/list`;
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    filters,
    setFilters,
    savedJobIds,
    handleSaveJob,
    appliedJobIds,
    isLoadingApplied,
    isLoadingSaved,
    refreshSavedJobs: fetchSavedJobs
  }), [filters, setFilters, savedJobIds, handleSaveJob, appliedJobIds, isLoadingApplied, isLoadingSaved, fetchSavedJobs]);

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
