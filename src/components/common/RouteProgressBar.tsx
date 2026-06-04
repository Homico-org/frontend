"use client";

import { ACCENT_COLOR } from "@/constants/theme";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Thin progress bar pinned to the top of the viewport that animates
 * when the user navigates between routes. NProgress in spirit -
 * makes every click feel responsive instead of waiting silently for
 * the new page to render.
 *
 * Implementation:
 *  - Watches `usePathname()`. When it changes, briefly slide a
 *    vermillion bar across the top.
 *  - First mount on a path doesn't show the bar (no nav happened).
 *  - 2px tall, behind modals (z-index below them) so it doesn't
 *    bleed over critical content.
 *  - Auto-hides after 600ms; no need for explicit start/stop.
 *
 * Pairs with the View Transitions API in NavigationProvider - the
 * VT animates the page swap; this bar communicates "something is
 * happening" in case the new route is JS-heavy and the swap is
 * delayed.
 */
export default function RouteProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const initialMountRef = useRef(true);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Skip the very first effect run - the user didn't navigate,
    // they just landed on the page.
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    // Clear any in-flight timers from a previous nav so we don't
    // double-trigger when the user clicks rapidly.
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setVisible(true);
    setProgress(20);

    // Stage 1: ramp to 70% over ~250ms. Most navigations land in
    // that window; the bar feels alive without sitting at one
    // percentage.
    timeoutsRef.current.push(setTimeout(() => setProgress(70), 80));

    // Stage 2: complete to 100% just before fading. View Transitions
    // typically settle within ~200ms.
    timeoutsRef.current.push(setTimeout(() => setProgress(100), 380));

    // Stage 3: fade and reset.
    timeoutsRef.current.push(
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 600),
    );

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [pathname]);

  return (
    <div
      // Pinned at the very top of the viewport, above the header.
      // z-index 9990 - below modals (9999) and toasts but above all
      // page content so users see it during navigation.
      className="fixed top-0 left-0 right-0 h-0.5 z-[9990] pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full transition-[width] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: ACCENT_COLOR,
          boxShadow: `0 0 8px ${ACCENT_COLOR}66`,
        }}
      />
    </div>
  );
}
