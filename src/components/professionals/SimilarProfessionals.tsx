"use client";

import ProCard from "@/components/common/ProCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import type { ProProfile } from "@/types/shared";
import { ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";

// Threshold: use grid layout if fewer pros, marquee if more
const MARQUEE_THRESHOLD = 4;

interface SimilarProfessionalsProps {
  categories: string[];
  subcategories: string[];
  currentProId: string;
  locale: string;
}

export default function SimilarProfessionals({
  categories,
  subcategories,
  currentProId,
}: SimilarProfessionalsProps) {
  const [professionals, setProfessionals] = useState<ProProfile[]>([]);
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const fetchInFlightRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const fetchSimilarPros = useCallback(async () => {
    // Prefer subcategories, fallback to categories
    const subcategory = subcategories?.[0] || "";
    const category = categories?.[0] || "";
    const fetchKey = `${subcategory || category}__${currentProId}`;

    if (fetchInFlightRef.current === fetchKey) return;
    fetchInFlightRef.current = fetchKey;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!subcategory && !category) {
      setIsLoading(false);
      fetchInFlightRef.current = null;
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("limit", "12");
      // Use subcategory for more precise matching
      if (subcategory) {
        params.append("subcategory", subcategory);
      } else if (category) {
        params.append("category", category);
      }

      const response = await api.get(`/users/pros?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = response.data;
      const pros = (data.data || []) as ProProfile[];
      
      const filtered = pros.filter((p) => p.id !== currentProId);
      setProfessionals(filtered);
    } catch (err) {
      if ((err as any)?.name === "CanceledError") return;
      if ((err as any)?.code === "ERR_CANCELED") return;
      console.error("Failed to fetch similar professionals:", err);
    } finally {
      setIsLoading(false);
      if (fetchInFlightRef.current === fetchKey) {
        fetchInFlightRef.current = null;
      }
    }
  }, [categories, subcategories, currentProId]);

  useEffect(() => {
    fetchSimilarPros();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchSimilarPros]);

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

  const browseUrl = `/browse/professionals?${subcategories.length > 0 ? `subcategories=${subcategories.join(',')}` : `category=${categories[0] || ""}`}`;
  const useMarquee = professionals.length > MARQUEE_THRESHOLD;

  return (
    <section className="py-8 sm:py-10 border-t border-neutral-200/50 dark:border-neutral-800/50">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-5 sm:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#C4735B] to-[#A85D48] flex items-center justify-center shadow-md shadow-[#C4735B]/20">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {t('professional.similarProfessionals')}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 hidden sm:block">
                {t('professional.fromTheSameCategory')}
              </p>
            </div>
          </div>

          <Link
            href={browseUrl}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {t('common.viewAll')}
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>

      {/* Grid layout for few professionals */}
      {!useMarquee && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className={`grid gap-4 ${
            professionals.length === 1
              ? 'grid-cols-1 max-w-sm mx-auto'
              : professionals.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                : professionals.length === 3
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}>
            {professionals.map((pro) => (
              <div key={pro.id} className="w-full">
                <ProCard profile={pro} variant="compact" showLikeButton={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marquee carousel for many professionals */}
      {useMarquee && (
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <Marquee
            speed={35}
            pauseOnHover={true}
            play={!isPaused}
            gradient={true}
            gradientColor="#FAFAFA"
            gradientWidth={60}
            className="py-1"
          >
            {professionals.map((pro, index) => (
              <div
                key={`${pro.id}-${index}`}
                className="mx-2 w-[280px] sm:w-[300px]"
              >
                <ProCard
                  profile={pro}
                  variant="compact"
                  showLikeButton={false}
                />
              </div>
            ))}
          </Marquee>

          {isPaused && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm z-20">
              {t('common.paused')}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
