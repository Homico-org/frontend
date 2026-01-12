"use client";

import { Button } from "@/components/ui/button";
import { ACCENT_COLOR as ACCENT, ACCENT_LIGHT } from "@/constants/theme";
import { storage } from "@/services/storage";
import {
  ArrowLeft,
  Check,
  Maximize2,
  Play,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface JobDetailHeroProps {
  media: MediaItem[];
  title: string;
  category?: string;
  subcategory?: string;
  status: "open" | "in_progress" | "completed" | "expired" | "cancelled";
  isHired?: boolean;
  locale: string;
  backHref?: string;
  onMediaClick?: (index: number) => void;
  categoryIllustration?: React.ReactNode;
}

export default function JobDetailHero({
  media,
  title,
  status,
  isHired = false,
  locale,
  backHref = "/browse/jobs",
  onMediaClick,
  categoryIllustration,
}: JobDetailHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auto-rotate images
  useEffect(() => {
    if (media.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % media.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [media.length]);

  const isOpen = status === "open";
  const hasMedia = media.length > 0;

  return (
    <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      {/* Background */}
      {hasMedia ? (
        <>
          {/* Main image with Ken Burns effect */}
          {media.map((item, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                idx === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Contained image */}
              <div className="absolute inset-0 flex items-center justify-center">
                {item.type === "video" ? (
                  <video
                    src={storage.getFileUrl(item.url)}
                    className="max-w-full max-h-full object-contain"
                    muted
                    loop
                    playsInline
                    autoPlay={idx === activeIndex}
                  />
                ) : (
                  <Image
                    src={storage.getFileUrl(item.url)}
                    alt={title}
                    fill
                    className="object-contain"
                    priority={idx === 0}
                  />
                )}
              </div>
              
              {/* Blurred background for letterboxing */}
              <div
                className="absolute inset-0 -z-10 scale-125 blur-3xl opacity-40"
                style={{
                  backgroundImage: `url(${storage.getFileUrl(item.url)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
          ))}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        </>
      ) : (
        <>
          {/* Elegant pattern background when no media */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-50 to-white dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            {/* Geometric pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Category illustration */}
          {categoryIllustration && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[250px] h-[250px] md:w-[350px] md:h-[350px] opacity-60">
                {categoryIllustration}
              </div>
            </div>
          )}

          {/* Bottom gradient for text */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-transparent" />
        </>
      )}

      {/* Back button */}
      <div
        className={`absolute top-6 left-4 md:left-8 z-20 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <Link
          href={backHref}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 transition-all duration-300 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">
            {t('common.back')}
          </span>
        </Link>
      </div>

      {/* Media counter & gallery button */}
      {media.length > 1 && (
        <div className="absolute top-6 right-4 md:right-8 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMediaClick?.(0)}
            className="rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 hover:text-white"
            leftIcon={<Maximize2 className="w-4 h-4" />}
          >
            {media.length} {t('heroes.photos')}
          </Button>
        </div>
      )}

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="absolute bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {media.slice(0, 6).map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-12 h-9 md:w-14 md:h-10 rounded-lg overflow-hidden transition-all duration-300 ${
                idx === activeIndex
                  ? "ring-2 ring-white scale-110 shadow-xl"
                  : "opacity-50 hover:opacity-100 hover:scale-105"
              }`}
            >
              <Image
                src={storage.getFileUrl(item.url)}
                alt=""
                fill
                className="object-cover"
              />
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              )}
            </button>
          ))}
          {media.length > 6 && (
            <button
              onClick={() => onMediaClick?.(0)}
              className="w-12 h-9 md:w-14 md:h-10 rounded-lg bg-black/50 backdrop-blur flex items-center justify-center text-white text-xs font-medium hover:bg-black/60 transition-colors"
            >
              +{media.length - 6}
            </button>
          )}
        </div>
      )}

      {/* Status badges */}
      <div className="absolute bottom-6 left-4 md:left-8 z-20">
        <div
          className={`flex flex-wrap items-center gap-3 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {isOpen && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                {t('heroes.active')}
              </span>
            </span>
          )}
          {isHired && (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg"
              style={{
                backgroundColor: `${ACCENT}30`,
                borderColor: `${ACCENT}50`,
              }}
            >
              <Check className="w-3.5 h-3.5" style={{ color: ACCENT_LIGHT }} />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: ACCENT_LIGHT }}
              >
                {t('heroes.hired')}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Progress indicators */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
