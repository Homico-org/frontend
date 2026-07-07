"use client";

import { useEffect, useRef, useState } from "react";
import { getScrollParent } from "@/utils/scrollUtils";

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
 *    the real scroll container. The app shell scrolls inside an
 *    `overflow-y-auto` <main>, not the window, so we resolve the
 *    actual scroller via `getScrollParent` and read its scrollTop
 *    (falling back to window.scrollY on pages the window scrolls).
 *    Measuring the wrong element used to leave scrollTop stuck at 0,
 *    arming the pull anywhere in the list.
 *  - Gesture state lives in refs, not React state, so the window
 *    listeners stay attached for the whole gesture (no re-attach
 *    mid-swipe) and touchend reads the live pull distance instead of
 *    a stale closure value. This also means a swipe whose touchmove
 *    events are swallowed by a child (e.g. a before/after slider)
 *    never arms a phantom refresh: the ref stays 0.
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
  // Live gesture distance, mirrored to state for rendering. touchend
  // reads this ref (not the `pullDistance` state) so it always sees
  // the value from the last touchmove, even though the listeners are
  // registered once and never re-created during the gesture.
  const pullDistanceRef = useRef(0);
  // Latest onRefresh / isRefreshing without re-subscribing listeners.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const isRefreshingRef = useRef(false);
  isRefreshingRef.current = isRefreshing;

  const setPull = (v: number) => {
    pullDistanceRef.current = v;
    setPullDistance(v);
  };

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    // Detect touch capability - skip on desktop where this gesture
    // would compete with the browser's native pull-to-refresh.
    if (!("ontouchstart" in window)) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      // Only engage when the REAL scroll container is at the top. The
      // shell scrolls inside an `overflow-y-auto` <main>, so window.scrollY
      // is always 0 there; resolve the actual scroller from the touched
      // node and read its scrollTop. Fall back to window for pages the
      // window itself scrolls (getScrollParent returns null).
      const target = e.target instanceof HTMLElement ? e.target : null;
      const scroller = getScrollParent(target);
      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      if (scrollTop > 5) return;
      // Fresh gesture: reset any residual pull from a previous swipe.
      setPull(0);
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
        setPull(0);
        isTrackingRef.current = false;
        return;
      }
      // Apply a square-root dampening so the indicator follows the
      // finger but doesn't run away as the user pulls further. Feels
      // springy without going off-screen.
      const damped = Math.min(distance * 0.5, threshold * 2);
      setPull(damped);
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
      const crossed = pullDistanceRef.current >= threshold;
      setPull(0);
      startYRef.current = null;
      if (crossed && !isRefreshingRef.current) {
        setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } finally {
          setIsRefreshing(false);
        }
      }
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
    // Listeners read live values through refs, so they only need to be
    // (re)wired when the gesture is enabled/disabled or the threshold
    // changes - never mid-swipe.
  }, [enabled, threshold]);

  return {
    isRefreshing,
    pullDistance,
    canTrigger: pullDistance >= threshold,
  };
}
