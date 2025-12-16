"use client";

import JobCard from "@/components/common/JobCard";
import JobsFiltersSidebar, { JobFilters, JOB_BUDGET_FILTERS } from "@/components/browse/JobsFiltersSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SAVED_JOBS_KEY = "homi_saved_jobs";

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

const DEFAULT_FILTERS: JobFilters = {
  category: null,
  subcategory: null,
  budget: 'all',
  propertyType: 'all',
  location: 'all',
  deadline: 'all',
  searchQuery: '',
};

export default function JobsPage() {
  const { locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const isPro = user?.role === "pro";

  // Local filters state for jobs page
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
  const [totalCount, setTotalCount] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const loaderRef = useRef<HTMLDivElement>(null);

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

  // Sort jobs with saved ones at the top
  const sortedJobs = jobs; // No longer sorting by saved status for now

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

  // Fetch jobs with filters
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

        // Apply category filter
        if (filters.category) {
          params.append("category", filters.category);
        }

        // Apply budget filter
        const budgetFilter = JOB_BUDGET_FILTERS.find(f => f.key === filters.budget);
        if (budgetFilter && filters.budget !== 'all') {
          if (budgetFilter.min !== undefined) params.append("budgetMin", budgetFilter.min.toString());
          if (budgetFilter.max !== undefined) params.append("budgetMax", budgetFilter.max.toString());
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

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/jobs?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
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

        setTotalCount(data.pagination?.total || data.total || 0);
        setHasMore(data.pagination?.hasMore ?? jobsList.length === 12);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isPro, filters]
  );

  // Track if initial fetch has been done
  const hasFetchedRef = useRef(false);

  // Reset and fetch when filters change
  useEffect(() => {
    if (!isPro) return;

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setPage(1);
      fetchJobs(1, true);
      return;
    }

    // For filter changes, reset and fetch
    setPage(1);
    fetchJobs(1, true);
  }, [isPro, filters, fetchJobs]);

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

  // Show loading while auth is loading or redirecting non-pro users
  if (isAuthLoading || !isPro) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-4">
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden">
            <JobsFiltersSidebar filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-sm font-medium text-[var(--color-text-secondary)]"
          >
            <Filter className="w-4 h-4" />
            {locale === 'ka' ? 'ფილტრები' : 'Filters'}
            {(filters.category || filters.budget !== 'all' || filters.propertyType !== 'all') && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[#E07B4F] text-white">
                {[filters.category, filters.budget !== 'all', filters.propertyType !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Results count */}
        {!isLoading && (
          <div className="mb-4 text-sm text-[var(--color-text-secondary)]">
            {totalCount > 0 ? (
              <>
                {locale === 'ka' ? 'ნაპოვნია' : 'Found'} <span className="font-semibold text-[var(--color-text-primary)]">{totalCount}</span> {locale === 'ka' ? 'სამუშაო' : 'jobs'}
              </>
            ) : null}
          </div>
        )}

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-[20px] bg-[#0a0a0a] overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-neutral-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 rounded-lg w-3/4 bg-neutral-800" />
                  <div className="h-4 rounded w-full bg-neutral-800/50" />
                  <div className="h-4 rounded w-2/3 bg-neutral-800/50" />
                  <div className="flex items-center gap-3 pt-3 border-t border-neutral-800">
                    <div className="w-10 h-10 rounded-lg bg-neutral-800" />
                    <div className="flex-1">
                      <div className="h-4 rounded w-20 bg-neutral-800 mb-1" />
                      <div className="h-3 rounded w-16 bg-neutral-800/50" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedJobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedJobs.map((job, index) => (
              <div
                key={job._id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
              >
                <JobCard
                  job={job}
                  onSave={handleSaveJob}
                  isSaved={savedJobIds.has(job._id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[var(--color-bg-tertiary)]"
            >
              <svg
                className="w-8 h-8 text-[var(--color-text-tertiary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
              {locale === "ka" ? "სამუშაოები არ მოიძებნა" : "No jobs found"}
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              {locale === "ka" ? "სცადეთ ფილტრების შეცვლა" : "Try adjusting your filters"}
            </p>
          </div>
        )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="py-10">
          {isLoadingMore && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E07B4F] border-t-transparent" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--color-bg-base)] shadow-xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]">
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                {locale === 'ka' ? 'ფილტრები' : 'Filters'}
              </h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            <JobsFiltersSidebar filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>
      )}
    </div>
  );
}
