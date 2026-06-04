"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate } from "@/utils/dateUtils";
import { AlertTriangle, Moon, TrendingDown } from "lucide-react";

/**
 * Banner that surfaces the pro's current SLA penalty state at the top
 * of their dashboard. Renders nothing when `slaPenaltyLevel === 'none'`
 * (the common case) so the dashboard stays clean for the well-behaved.
 *
 * Three tiers, each with their own visual weight:
 *   - warning  -> yellow,  "you missed something, reply faster"
 *   - demoted  -> orange,  "you're lower in search until {date}"
 *   - paused   -> red,     "you're hidden from clients until {date}"
 *
 * The two timed tiers (demoted + paused) read their expiry from the
 * existing fields (`slaDemotedUntil`, `deactivatedUntil`) - no
 * frontend countdown timer because the cron auto-recovers and the
 * value is just a target date for context.
 *
 * Banner reads from useAuth().user. When the cron's recovery sweep
 * flips the pro back to NONE on the next 5-min tick, the next page
 * fetch picks up the cleared state and the banner disappears.
 */
export default function SlaStatusBanner() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();

  if (!user) return null;
  if (user.role !== "pro" && user.role !== "admin") return null;
  const level = user.slaPenaltyLevel;
  if (!level || level === "none") return null;

  const fmtLocale = locale as "en" | "ka" | "ru";

  if (level === "warning") {
    return (
      <div
        className="rounded-xl p-4 mb-4 flex items-start gap-3"
        style={{
          backgroundColor: "rgba(234, 179, 8, 0.08)",
          border: "1px solid rgba(234, 179, 8, 0.25)",
        }}
      >
        <AlertTriangle className="w-5 h-5 text-[var(--hm-warning-500)] flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--hm-warning-500)]">
            {t("sla.warningTitle")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--hm-fg-secondary)" }}>
            {t("sla.warningBody")}
          </p>
        </div>
      </div>
    );
  }

  if (level === "demoted") {
    const until = user.slaDemotedUntil
      ? formatDate(user.slaDemotedUntil, fmtLocale)
      : "";
    return (
      <div
        className="rounded-xl p-4 mb-4 flex items-start gap-3"
        style={{
          backgroundColor: "rgba(249, 115, 22, 0.08)",
          border: "1px solid rgba(249, 115, 22, 0.25)",
        }}
      >
        <TrendingDown className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-orange-500">
            {t("sla.demotedTitle")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--hm-fg-secondary)" }}>
            {t("sla.demotedBody", { date: until })}
          </p>
        </div>
      </div>
    );
  }

  // Paused. Source-of-truth for the until date is the existing
  // `deactivatedUntil` field (the SLA reuses the deactivation
  // machinery rather than minting a second mechanism). We only render
  // when deactivationReason is 'sla_breach' so a user-initiated
  // pause doesn't get the SLA framing.
  if (level === "paused" && user.deactivationReason === "sla_breach") {
    const until = user.deactivatedUntil
      ? formatDate(user.deactivatedUntil, fmtLocale)
      : "";
    return (
      <div
        className="rounded-xl p-4 mb-4 flex items-start gap-3"
        style={{
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
        }}
      >
        <Moon className="w-5 h-5 text-[var(--hm-error-500)] flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--hm-error-500)]">
            {t("sla.pausedTitle")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--hm-fg-secondary)" }}>
            {t("sla.pausedBody", { date: until })}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
