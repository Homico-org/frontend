"use client";

import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  /**
   * Async refetch invoked when the user pulls past `threshold`. The
   * loading indicator stays up until the returned promise resolves.
   */
  onRefresh: () => Promise<void> | void;
  /**
   * How far the user has to pull (in pixels) before letting go
   * triggers a refresh. Below this, the gesture is treated as a
   * normal scroll attempt and the spinner snaps back. 70px is
   * roughly two thumb-tip heights - high enough to avoid accidental
   * triggers, low enough to feel responsive.
   */
  threshold?: number;
  /**
   * Set to false to skip wiring up listeners entirely (e.g. on
   * desktop, or on pages where pull-to-refresh would interfere with
   * native UI like a swipe-able image carousel).
   */
  enabled?: boolean;
}

export interface PullToRefreshState {
  /** True while a refresh is in-flight. */
  isRefreshing: boolean;
  /** Current vertical displacement (0 if not pulling). */
  pullDistance: number;
  /** True when the pull has crossed the trigger threshold. */
  canTrigger: boolean;
}

/**
 * Pull-down-to-refresh gesture. Wire it to a list page that displays
 * server-fetched data. Native mobile expectation - users instinctively
 * swipe down at the top of a list to refresh; if the gesture does
 * nothing, the app feels stale.
 *
 * Implementation notes:
 *  - Only triggers when the user starts the gesture AT the top of
 *    the page (window.scrollY === 0). Otherwise it's a regular scroll.
 *  - Touch-only (passive false to enable preventDefault). On desktop
 *    we just skip the listeners entirely.
 *  - The visual indicator is the caller's job - this hook only
 *    exposes the gesture state so the caller can render whatever
 *    spinner / animation fits the design.
 */
export function usePullToRefresh({ onRefresh, threshold = 70, enabled = true }: UsePullToRefreshOptions): PullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const isTrackingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    // Detect touch capability - skip on desktop where this gesture
    // would compete with the browser's native pull-to-refresh.
    if (!("ontouchstart" in window)) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only engage when we're already at the top. If the user is
      // mid-scroll halfway down the list, a downward swipe means
      // scroll-up, not refresh.
      if (window.scrollY > 5) return;
      if (isRefreshing) return;
      startYRef.current = e.touches[0].clientY;
      isTrackingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingRef.current || startYRef.current === null) return;
      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;
      if (distance <= 0) {
        // User is swiping upward (scroll-down direction). Abandon
        // the pull-to-refresh attempt; let the browser scroll.
        setPullDistance(0);
        isTrackingRef.current = false;
        return;
      }
      // Apply a square-root dampening so the indicator follows the
      // finger but doesn't run away as the user pulls further. Feels
      // springy without going off-screen.
      const damped = Math.min(distance * 0.5, threshold * 2);
      setPullDistance(damped);
      // Prevent the browser's native pull-to-refresh while we're
      // handling our own. Only past a small dead-zone so casual
      // taps don't get blocked.
      if (distance > 10 && e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isTrackingRef.current) return;
      isTrackingRef.current = false;
      const crossed = pullDistance >= threshold;
      if (crossed && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      setPullDistance(0);
      startYRef.current = null;
    };

    // `passive: false` on touchmove so we can preventDefault to
    // block the browser's native pull-to-refresh while ours is
    // active. touchstart/touchend stay passive (they don't need
    // to cancel anything) for scroll performance.
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [enabled, isRefreshing, onRefresh, pullDistance, threshold]);

  return {
    isRefreshing,
    pullDistance,
    canTrigger: pullDistance >= threshold,
  };
}
