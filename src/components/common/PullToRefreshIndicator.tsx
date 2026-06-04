"use client";

import { ACCENT_COLOR } from "@/constants/theme";
import { Loader2, RefreshCw } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  canTrigger: boolean;
  isRefreshing: boolean;
}

/**
 * Visual feedback for the pull-to-refresh gesture. Sits at the top
 * of the viewport, scales the indicator with the user's finger, and
 * spins once a refresh is in-flight. Pair with `usePullToRefresh`:
 *
 * ```tsx
 * const { pullDistance, canTrigger, isRefreshing } = usePullToRefresh({ onRefresh });
 * <PullToRefreshIndicator {...{ pullDistance, canTrigger, isRefreshing }} />
 * ```
 */
export default function PullToRefreshIndicator({
  pullDistance,
  canTrigger,
  isRefreshing,
}: PullToRefreshIndicatorProps) {
  // Hide entirely when the user isn't pulling and we're not in the
  // middle of a refresh. Avoids a layout artifact above the content.
  if (pullDistance === 0 && !isRefreshing) return null;

  // The indicator pops in from a small offset, then follows the
  // finger 1:1 (the `usePullToRefresh` hook already dampens the
  // gesture so this stays in the visible band).
  const translateY = isRefreshing ? 50 : Math.min(pullDistance, 80);
  const opacity = Math.min(pullDistance / 50, 1);
  const rotation = canTrigger ? 180 : (pullDistance / 70) * 180;

  return (
    <div
      className="lg:hidden fixed top-14 left-0 right-0 z-30 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${translateY - 50}px)`, opacity: isRefreshing ? 1 : opacity }}
    >
      <div
        className="w-10 h-10 rounded-full bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] shadow-lg flex items-center justify-center transition-colors"
        style={{ color: canTrigger || isRefreshing ? ACCENT_COLOR : "var(--hm-fg-muted)" }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <RefreshCw
            className="w-5 h-5 transition-transform duration-150"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        )}
      </div>
    </div>
  );
}
