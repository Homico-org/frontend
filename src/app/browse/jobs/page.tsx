"use client";

import { BUDGET_FILTERS } from "@/components/browse/JobsFilterSection";
import JobCard from "@/components/common/JobCard";
import { useAuth } from "@/contexts/AuthContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export default function JobsPage() {
  const { locale } = useLanguage();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedBudget } = useBrowseContext();
  const router = useRouter();

  const isPro = user?.role === "pro";

  // Redirect non-pro users to portfolio page
  useEffect(() => {
    if (!isAuthLoading && !isPro) {
      router.replace("/browse/portfolio");
    }
  }, [isAuthLoading, isPro, router]);

  // Get user's categories from their profile
  const userCategories = user?.selectedCategories || [];

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
  const sortedJobs = useMemo(() => {
    if (savedJobIds.size === 0) return jobs;

    const saved: Job[] = [];
    const unsaved: Job[] = [];

    jobs.forEach((job) => {
      if (savedJobIds.has(job._id)) {
        saved.push(job);
      } else {
        unsaved.push(job);
      }
    });

    return [...saved, ...unsaved];
  }, [jobs, savedJobIds]);

  // Mock images for demo - home improvement related
  const mockImageSets = [
    [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", // Kitchen renovation
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
      "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&q=80", // Bathroom
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80", // Painting
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80",
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
      "https://images.unsplash.com/photo-1595514535215-95c0b5e783c1?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", // Flooring
      "https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=800&q=80",
    ],
    [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80", // Living room
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    [], // Some jobs without images
    [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80", // Electrical
    ],
    [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80", // Construction
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
      "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=800&q=80",
    ],
    [], // Some jobs without images
    [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80", // Garden
      "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80",
    ],
  ];

  // Get budget filter params
  const getBudgetParams = useCallback(() => {
    const filter = BUDGET_FILTERS.find(f => f.key === selectedBudget);
    if (!filter || filter.key === 'all') return {};
    return {
      budgetMin: filter.min,
      budgetMax: filter.max,
    };
  }, [selectedBudget]);

  // Fetch jobs
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

        // Filter by user's categories - show jobs matching their professional categories
        if (userCategories.length > 0) {
          userCategories.forEach((cat: string) => {
            params.append("categories", cat);
          });
        }

        // Apply budget filter
        const budgetParams = getBudgetParams();
        if (budgetParams.budgetMin) params.append("budgetMin", budgetParams.budgetMin.toString());
        if (budgetParams.budgetMax) params.append("budgetMax", budgetParams.budgetMax.toString());

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
          // Only add mock images if job doesn't have any
          if ((!job.images || job.images.length === 0) && (!job.media || job.media.length === 0)) {
            const mockImages = mockImageSets[index % mockImageSets.length];
            return {
              ...job,
              images: mockImages,
            };
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
    [isPro, userCategories, getBudgetParams]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchJobs(1, true);
  }, [selectedBudget, isPro, userCategories]);

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
  }, [page]);

  // Show loading while auth is loading or redirecting non-pro users
  if (isAuthLoading || !isPro) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Jobs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-[#D2691E]/10 dark:border-[#CD853F]/15 overflow-hidden animate-pulse"
            >
              {/* Image skeleton */}
              <div className="aspect-[16/10] bg-[#D2691E]/5 relative">
                {/* Price badge skeleton */}
                <div className="absolute top-3 right-3 w-16 h-6 rounded-lg bg-white/70 dark:bg-gray-800/70" />
                {/* Category badge skeleton */}
                <div className="absolute top-3 left-3 w-20 h-5 rounded-md bg-[#D2691E]/20" />
              </div>
              {/* Content skeleton */}
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-3 rounded bg-[#D2691E]/10" />
                  <div className="w-10 h-3 rounded bg-[#D2691E]/5" />
                </div>
                {/* Title */}
                <div className="h-5 rounded-lg w-4/5 mb-2 bg-[#D2691E]/10" />
                {/* Description */}
                <div className="h-4 rounded w-full mb-1 bg-[#D2691E]/5" />
                <div className="h-4 rounded w-2/3 mb-3 bg-[#D2691E]/5" />
                {/* Meta */}
                <div className="flex gap-2 mb-3">
                  <div className="w-14 h-3 rounded bg-[#D2691E]/5" />
                  <div className="w-10 h-3 rounded bg-[#D2691E]/5" />
                </div>
                {/* Bottom section */}
                <div className="flex items-center justify-between pt-3 border-t border-[#D2691E]/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D2691E]/10" />
                    <div>
                      <div className="w-20 h-3 rounded bg-[#D2691E]/10 mb-1" />
                      <div className="w-14 h-2 rounded bg-[#D2691E]/5" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-16 h-7 rounded-lg bg-[#D2691E]/10" />
                    <div className="w-7 h-7 rounded-lg bg-[#D2691E]/10" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedJobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
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
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-bg-tertiary)" }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: "var(--color-text-tertiary)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {locale === "ka" ? "სამუშაოები არ მოიძებნა" : "No jobs found"}
          </h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ka" ? "ახალი სამუშაოები მალე გამოჩნდება" : "New jobs coming soon"}
          </p>
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="py-10">
        {isLoadingMore && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D2691E] border-t-transparent" />
          </div>
        )}
      </div>
    </>
  );
}
