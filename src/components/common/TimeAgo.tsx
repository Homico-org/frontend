"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatDateTime,
  formatMessageTime,
  formatTimeAgo,
  formatTimeAgoCompact,
  type Locale,
  type TranslateFunction,
} from "@/utils/dateUtils";

interface TimeAgoProps {
  /** ISO date string to display. */
  isoDate: string;
  /**
   * Display style.
   * - `compact`: "5m", "2h", "3d" (lists, headers, badges)
   * - `full`: "5 minutes ago" (cards, detail rows)
   * - `time`: just the time of day "14:30" (chat messages)
   * Defaults to `compact`.
   */
  variant?: "compact" | "full" | "time";
  /** Additional class names */
  className?: string;
}

/**
 * Renders a relative timestamp ("2 hours ago") with the absolute
 * date/time pinned to its `title` attribute. Hover (desktop) or
 * long-press (mobile via OS hint) reveals precision when the user
 * wants it.
 *
 * Uses a `<time>` element with `dateTime={iso}` so screen readers
 * and search bots can parse the canonical timestamp regardless of
 * how it's rendered.
 *
 * ```tsx
 * <TimeAgo isoDate={notification.createdAt} variant="compact" />
 * ```
 */
export default function TimeAgo({ isoDate, variant = "compact", className }: TimeAgoProps) {
  const { locale, t } = useLanguage();
  const localeKey = locale as Locale;

  let displayText = "";
  switch (variant) {
    case "full":
      displayText = formatTimeAgo(isoDate, t as unknown as TranslateFunction);
      break;
    case "time":
      displayText = formatMessageTime(isoDate);
      break;
    case "compact":
    default:
      displayText = formatTimeAgoCompact(isoDate, localeKey);
      break;
  }

  const absolute = formatDateTime(isoDate, localeKey);

  return (
    <time dateTime={isoDate} title={absolute} className={className}>
      {displayText}
    </time>
  );
}
