"use client";

import { useEffect, useRef } from "react";

interface UseRefreshOnFocusOptions {
  /**
   * Don't refetch if the last refresh was within this many ms. Avoids
   * a thrash when the user tabs back and forth rapidly. Defaults to
   * 30s which lines up with how stale data feels to most users.
   */
  staleAfterMs?: number;
  /**
   * Disable the listener entirely. Useful when a page wants to opt
   * out (e.g. an authoring view where re-fetching would discard
   * unsaved work).
   */
  disabled?: boolean;
}

/**
 * Run `refetch` whenever the tab regains visibility, but only if the
 * data has had time to go stale. Common bug class for SPA apps: user
 * switches away for 10 minutes, comes back, sees the data they had
 * before the switch and has no idea it's outdated. Native mobile
 * apps refresh on resume; browsers don't, so we do it ourselves.
 *
 * Wire it into any list page that displays server-fetched data:
 *
 * ```ts
 * useRefreshOnFocus(() => fetchJobs(1));
 * ```
 */
export function useRefreshOnFocus(refetch: () => void, options: UseRefreshOnFocusOptions = {}) {
  const { staleAfterMs = 30_000, disabled = false } = options;
  // Keep the latest refetch in a ref so the visibility listener
  // doesn't have to be re-attached every time the parent re-renders.
  // Without this, every parent render rebinds the listener and
  // tears off the timestamp tracking.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  // Time of the last refresh (either the mount or the last fire).
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    if (disabled) return;
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      // Only fire when the tab comes back to the foreground.
      if (document.visibilityState !== "visible") return;
      const elapsed = Date.now() - lastRefreshRef.current;
      if (elapsed < staleAfterMs) return;
      lastRefreshRef.current = Date.now();
      refetchRef.current();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    // `pageshow` covers BFCache restores on Safari which don't always
    // fire visibilitychange. Without this, an iOS user swiping back
    // from a detail page would see stale data.
    window.addEventListener("pageshow", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handleVisibility);
    };
  }, [disabled, staleAfterMs]);
}
