"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Zap } from "lucide-react";

interface ResponseTimeChipProps {
  /**
   * Average response time in hours, from `ProProfile.avgResponseTime`.
   * Renders nothing when unset, zero, or > 24h (a 36h average reads
   * worse than no number - users assume the pro is dead).
   */
  avgHours: number | null | undefined;
  /**
   * Inline (default) wraps in a flex span suitable for sitting next
   * to other meta chips. `block` wraps in a standalone pill for the
   * hero of a pro profile.
   */
  variant?: "inline" | "block";
  className?: string;
}

/**
 * Tiny "Typically responds in X" chip backed by `ProProfile.avgResponseTime`.
 * Extracted from the inline render at `ProCard.tsx:606-618` so the
 * pro detail page, proposal cards, and any future surface can reuse
 * the same thresholds + i18n keys without forking.
 *
 * The thresholds (< 1h, ≤ 4h, ≤ 24h) match the original card's
 * coarse bucketing - exact-hour copy would feel false-precise for a
 * derived stat and the bucketing forgives small variance in the
 * backend's rolling window.
 */
export default function ResponseTimeChip({ avgHours, variant = "inline", className = "" }: ResponseTimeChipProps) {
  const { t } = useLanguage();
  if (avgHours == null || avgHours <= 0 || avgHours > 24) return null;

  const label =
    avgHours < 1
      ? t("professional.lessThanHour")
      : avgHours <= 4
        ? t("professional.lessThanHours", { count: 4 })
        : t("professional.lessThanHours", { count: 24 });

  if (variant === "block") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--hm-success-500)]/10 text-[var(--hm-success-500)] text-xs font-medium ${className}`}
      >
        <Zap className="w-3 h-3" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1 text-[var(--hm-success-500)] font-medium ${className}`}
    >
      <Zap className="w-3 h-3" />
      {label}
    </span>
  );
}
