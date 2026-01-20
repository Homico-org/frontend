"use client";

import ProCard from "@/components/common/ProCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ACCENT_COLOR } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import type { ProProfile } from "@/types/shared";
import { ChevronRight, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";

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

  return (
    <section className="py-10 sm:py-12 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-gradient-to-b from-transparent via-neutral-50/50 to-transparent dark:via-neutral-900/30">
      {/* Header */}
      <div className="max-w-[90%] mx-auto mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4735B] to-[#A85D48] flex items-center justify-center shadow-lg shadow-[#C4735B]/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {t('professional.similarProfessionals')}
              </h2>
              <p className="text-sm text-neutral-500">
                {t('professional.fromTheSameCategory')}
              </p>
            </div>
          </div>

          <a
            href={`/browse/professionals?${subcategories.length > 0 ? `subcategories=${subcategories.join(',')}` : `category=${categories[0] || ""}`}`}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {t('common.viewAll')}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Mobile list */}
      <div className="sm:hidden max-w-[90%] mx-auto">
        <div className="grid grid-cols-1 gap-4">
          {professionals.slice(0, 4).map((pro) => (
            <div key={pro.id} className="w-full">
              <ProCard profile={pro} variant="compact" showLikeButton={false} />
            </div>
          ))}
        </div>
        <div className="mt-5">
          <a
            href={`/browse/professionals?${subcategories.length > 0 ? `subcategories=${subcategories.join(',')}` : `category=${categories[0] || ""}`}`}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {t("common.viewAll")}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Desktop: Marquee carousel */}
      <div 
        className="hidden sm:block relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <Marquee
          speed={40}
          pauseOnHover={true}
          play={!isPaused}
          gradient={true}
          gradientColor="#FAFAFA"
          gradientWidth={80}
          className="py-2"
        >
          {/* Duplicate items to ensure seamless loop without gaps */}
          {[...professionals, ...professionals].map((pro, index) => (
            <div
              key={`${pro.id}-${index}`}
              className="mx-2.5 w-[300px] transition-transform duration-300 hover:scale-[1.02]"
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm z-20">
            {t('common.paused')}
          </div>
        )}
      </div>
    </section>
  );
}
