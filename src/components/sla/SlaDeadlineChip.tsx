"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface SlaDeadlineChipProps {
  /**
   * Wall-clock time the SLA-tracked action is due. The chip computes
   * minutes-remaining from `Date.now()` and re-renders once a minute
   * via an internal interval. Pass the SAME instance across renders
   * when possible - a new Date object on every parent render would
   * reset the interval needlessly.
   */
  deadline: Date | string;
  /**
   * Tighter visual for inline placement (e.g. inside a card row) vs
   * the default block treatment used at the top of a card.
   */
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Countdown chip that gives pros a visible nudge before they cross
 * an SLA deadline. Three colour states based on minutes remaining:
 *
 *   - > 30 min   green   (calm)
 *   - 10-30 min  amber   (heads up)
 *   - <= 10 min  red     (urgent)
 *
 * Returns null once the deadline has passed - the cron will record
 * the miss separately, no point showing a chip the pro can't act on.
 *
 * Format choice: "{N} min" up to 60, then "{H}h {N}m". Skips
 * "1h 0m" by collapsing the zero-minute case.
 */
export default function SlaDeadlineChip({
  deadline,
  size = "sm",
  className = "",
}: SlaDeadlineChipProps) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const deadlineMs =
    typeof deadline === "string" ? new Date(deadline).getTime() : deadline.getTime();
  if (!Number.isFinite(deadlineMs)) return null;
  const minutesLeft = Math.floor((deadlineMs - now) / 60_000);
  if (minutesLeft < 0) return null;

  const tone =
    minutesLeft <= 10
      ? "urgent"
      : minutesLeft <= 30
        ? "warn"
        : "ok";

  // Class selection is static-string so Tailwind's JIT picks them up.
  const toneClasses =
    tone === "urgent"
      ? "bg-[var(--hm-error-500)]/10 text-[var(--hm-error-500)] border-[var(--hm-error-500)]/25"
      : tone === "warn"
        ? "bg-[var(--hm-warning-500)]/10 text-[var(--hm-warning-500)] border-[var(--hm-warning-500)]/25"
        : "bg-[var(--hm-success-500)]/10 text-[var(--hm-success-500)] border-[var(--hm-success-500)]/25";

  const sizeClasses =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-1"
      : "text-xs px-2 py-0.5 gap-1.5";

  const iconClass = size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3";

  const label =
    minutesLeft < 60
      ? t("sla.respondInMinutes", { minutes: minutesLeft })
      : t("sla.respondInHourAndMinutes", {
          hours: Math.floor(minutesLeft / 60),
          minutes: minutesLeft % 60,
        });

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tabular-nums ${toneClasses} ${sizeClasses} ${className}`}
      title={label}
    >
      <Clock className={iconClass} />
      {label}
    </span>
  );
}
