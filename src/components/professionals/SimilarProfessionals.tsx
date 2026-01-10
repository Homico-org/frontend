"use client";

import ProCard from "@/components/common/ProCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR } from "@/constants/theme";
import { api } from "@/lib/api";
import type { ProProfile } from "@/types/shared";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SimilarProfessionalsProps {
  categories: string[];
  currentProId: string;
  locale: string;
}

export default function SimilarProfessionals({
  categories,
  currentProId,
  locale,
}: SimilarProfessionalsProps) {
  const [professionals, setProfessionals] = useState<ProProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const fetchSimilarPros = useCallback(async () => {
    if (!categories.length) {
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("limit", "12");
      if (categories[0]) {
        params.append("category", categories[0]);
      }

      const response = await api.get(`/users/pros?${params.toString()}`);
      const data = response.data;
      const pros = (data.data || []) as ProProfile[];
      
      // Filter out the current professional
      const filtered = pros.filter((p) => p.id !== currentProId);
      setProfessionals(filtered);
    } catch (err) {
      console.error("Failed to fetch similar professionals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [categories, currentProId]);

  useEffect(() => {
    fetchSimilarPros();
  }, [fetchSimilarPros]);

  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollButtons();
    container.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [checkScrollButtons, professionals]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 320; // Approximate card width + gap
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner size="lg" color={ACCENT_COLOR} />
      </div>
    );
  }

  if (professionals.length === 0) {
    return null;
  }

  return (
    <section className="py-8 border-t border-neutral-200/50 dark:border-neutral-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4735B] to-[#A85D48] flex items-center justify-center shadow-lg shadow-[#C4735B]/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {locale === "ka" ? "მსგავსი სპეციალისტები" : "Similar Professionals"}
            </h2>
            <p className="text-sm text-neutral-500">
              {locale === "ka" 
                ? "იგივე კატეგორიიდან" 
                : "From the same category"}
            </p>
          </div>
        </div>

        {/* Navigation arrows - Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`
              w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
              ${canScrollLeft
                ? "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`
              w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
              ${canScrollRight
                ? "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed"
              }
            `}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable cards container */}
      <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#FAFAFA] dark:from-[#0A0A0A] to-transparent z-10 pointer-events-none lg:hidden" />
        )}

        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#FAFAFA] dark:from-[#0A0A0A] to-transparent z-10 pointer-events-none lg:hidden" />
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-0 pb-2 snap-x snap-mandatory"
        >
          {professionals.map((pro, index) => (
            <div
              key={pro.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ProCard
                profile={pro}
                variant="compact"
                showLikeButton={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* View all link */}
      {professionals.length >= 6 && (
        <div className="mt-6 text-center">
          <a
            href={`/browse/professionals?category=${categories[0] || ""}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {locale === "ka" ? "ყველას ნახვა" : "View All"}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </section>
  );
}
