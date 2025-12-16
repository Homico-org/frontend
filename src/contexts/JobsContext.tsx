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
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

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
    <JobsContext.Provider value={{ filters, setFilters, savedJobIds, handleSaveJob }}>
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
