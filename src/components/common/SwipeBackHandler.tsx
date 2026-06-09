"use client";

import { useAuth } from "@/contexts/AuthContext";
import { backOrNavigate, defaultBackFallback } from "@/utils/navigationUtils";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Edge-swipe back gesture for installed PWAs. Native iOS Safari and
 * Chrome already handle this in browser context, but when Homico is
 * "Add to Home Screen"'d there's no browser chrome and no edge
 * swipe - users get stuck on detail pages with no obvious way back.
 *
 * Behavior:
 *  - Touch must start in the leftmost 24px of the viewport.
 *  - Track rightward delta; if it exceeds 80px before lift, navigate
 *    back via `backOrNavigate` (role-aware fallback).
 *  - Vertical motion > horizontal cancels the gesture - the user
 *    probably means to scroll.
 *  - Skips entirely when the device isn't standalone-display (a
 *    regular browser tab, where the browser handles its own back
 *    swipe). Detected via `display-mode: standalone` media query
 *    and `navigator.standalone` for iOS.
 *
 * Mounted once at the root layout. Self-contained, no provider.
 */
const EDGE_WIDTH = 24;
const TRIGGER_DISTANCE = 80;
const MAX_VERTICAL_DRIFT = 50;

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  // Chrome / Android PWA
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari adds this on home-screen-installed PWAs
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export default function SwipeBackHandler() {
  const router = useRouter();
  const { user } = useAuth();
  // Latest user ref so the touchend listener picks the up-to-date
  // role for the fallback without rebinding on every render.
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isStandalonePwa()) return;
    if (!("ontouchstart" in window)) return;

    let startX: number | null = null;
    let startY: number | null = null;

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (touch.clientX > EDGE_WIDTH) return;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleEnd = (e: TouchEvent) => {
      if (startX === null || startY === null) return;
      const touch = e.changedTouches[0];
      if (!touch) {
        startX = null;
        startY = null;
        return;
      }
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      startX = null;
      startY = null;
      // Vertical-leaning swipe - user was scrolling, not navigating.
      if (dy > MAX_VERTICAL_DRIFT) return;
      // Threshold crossed - trigger back navigation.
      if (dx >= TRIGGER_DISTANCE) {
        backOrNavigate(router, defaultBackFallback(userRef.current));
      }
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [router]);

  return null;
}
