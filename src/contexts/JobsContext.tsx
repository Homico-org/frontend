'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface JobFilters {
  category: string | null;
  subcategory: string | null;
  budget: string;
  propertyType: string;
  location: string;
  deadline: string;
  searchQuery: string;
  showFavoritesOnly: boolean;
}

const DEFAULT_FILTERS: JobFilters = {
  category: null,
  subcategory: null,
  budget: 'all',
  propertyType: 'all',
  location: 'all',
  deadline: 'all',
  searchQuery: '',
  showFavoritesOnly: false,
};

const SAVED_JOBS_KEY = "homi_saved_jobs";

interface JobsContextType {
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
  savedJobIds: Set<string>;
  handleSaveJob: (jobId: string) => void;
  appliedJobIds: Set<string>;
  isLoadingApplied: boolean;
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isLoadingApplied, setIsLoadingApplied] = useState(true);

  // Load saved jobs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_JOBS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedJobIds(new Set(parsed));
      } catch (e) {
        console.error("Error parsing saved jobs:", e);
      }
    }
  }, []);

  // Fetch user's proposals to know which jobs they've applied to
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingApplied(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/jobs/my-proposals/list`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const proposals = data.data || data.proposals || data || [];
          // Extract job IDs from proposals
          const jobIds = new Set<string>(
            proposals
              .map((p: { jobId?: string | { _id: string } }) => {
                if (typeof p.jobId === 'string') return p.jobId;
                if (p.jobId && typeof p.jobId === 'object' && '_id' in p.jobId) return p.jobId._id;
                return null;
              })
              .filter(Boolean)
          );
          setAppliedJobIds(jobIds);
        }
      } catch (error) {
        console.error("Error fetching applied jobs:", error);
      } finally {
        setIsLoadingApplied(false);
      }
    };

    fetchAppliedJobs();
  }, []);

  // Handle save/unsave job
  const handleSaveJob = useCallback((jobId: string) => {
    setSavedJobIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  return (
    <JobsContext.Provider value={{
      filters,
      setFilters,
      savedJobIds,
      handleSaveJob,
      appliedJobIds,
      isLoadingApplied
    }}>
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
