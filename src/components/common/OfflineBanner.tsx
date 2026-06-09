"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Network-status banner pinned to the top of the viewport when the
 * browser reports we've gone offline. Without it, submits + saves
 * fail silently and the user just sees forms that "do nothing."
 *
 * Goes briefly green when connection returns so the user sees
 * positive confirmation, then auto-dismisses after 2s.
 */
export default function OfflineBanner() {
  const { t } = useLanguage();
  // Start true so SSR + first client paint don't flash the banner
  // before the navigator API has settled.
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Sync initial state on mount.
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Brief "back online" flash so the user sees the recovery,
      // not just the absence of the offline bar.
      setShowRestored(true);
      window.setTimeout(() => setShowRestored(false), 2000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  // Offline state: amber banner, persistent.
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--hm-warning-500)] text-white text-xs sm:text-sm font-medium shadow-md"
      >
        <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="truncate">
          {t("connection.offline")}
          <span className="hidden sm:inline opacity-90"> - {t("connection.offlineHint")}</span>
        </span>
      </div>
    );
  }

  // Restored state: green flash, auto-dismisses.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--hm-success-500)] text-white text-xs sm:text-sm font-medium shadow-md animate-fade-in"
    >
      <span>{t("connection.backOnline")}</span>
    </div>
  );
}
