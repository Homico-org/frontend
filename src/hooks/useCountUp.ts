"use client";

import { useEffect, useRef, useState } from "react";

// Animated counter that ramps from 0 -> `target` once when the value
// first becomes non-zero. Subsequent target changes update instantly
// (no re-animation on every prop change), so the count-up reads as a
// one-time reveal rather than constant motion.
//
// Honors prefers-reduced-motion: users with reduced motion get the
// final value immediately, no animation.
export function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (target <= 0) {
      setValue(target);
      return;
    }

    // Skip animation entirely for reduced-motion users.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || hasAnimatedRef.current) {
      setValue(target);
      hasAnimatedRef.current = true;
      return;
    }

    hasAnimatedRef.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic - lands softly without overshoot
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
