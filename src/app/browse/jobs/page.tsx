"use client";

import JobCard from "@/components/common/JobCard";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBrowseContext } from "@/contexts/BrowseContext";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const { selectedCategory, selectedSubcategory } = useBrowseContext();

  const isPro = user?.role === "pro";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

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

        if (selectedCategory) params.append("category", selectedCategory);
        if (selectedSubcategory) params.append("subcategory", selectedSubcategory);

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
        const jobsList = data.jobs || [];

        if (reset) {
          setJobs(jobsList);
        } else {
          setJobs((prev) => [...prev, ...jobsList]);
        }

        setTotalCount(data.total || 0);
        setHasMore(jobsList.length === 12);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isPro, selectedCategory, selectedSubcategory]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchJobs(1, true);
  }, [selectedCategory, selectedSubcategory, isPro]);

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

  if (!isPro) {
    return (
      <div className="text-center py-16">
        <p style={{ color: "var(--color-text-secondary)" }}>
          {locale === "ka" ? "მხოლოდ პროფესიონალებისთვის" : "Only available for professionals"}
        </p>
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
              className="rounded-2xl border p-4 sm:p-5 animate-pulse"
              style={{
                backgroundColor: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="h-32 rounded-xl mb-4"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              />
              <div
                className="h-5 rounded-lg w-3/4 mb-2"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              />
              <div
                className="h-4 rounded-lg w-1/2"
                style={{ backgroundColor: "var(--color-bg-tertiary)" }}
              />
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {jobs.map((job, index) => (
            <div
              key={job._id}
              className="animate-fade-in"
              style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
            >
              <JobCard job={job} />
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
            {locale === "ka" ? "შეთავაზებები არ მოიძებნა" : "No opportunities found"}
          </h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ka" ? "ახალი შეთავაზებები მალე გამოჩნდება" : "New opportunities coming soon"}
          </p>
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="py-10">
        {isLoadingMore && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent)] border-t-transparent" />
          </div>
        )}
      </div>
    </>
  );
}
