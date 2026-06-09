"use client";

import { useCallback } from "react";

/**
 * Tiny vibration patterns for common UI feedback. The numbers are
 * milliseconds; the Vibration API takes either a single number or
 * a pattern array of on/off durations.
 *
 * - `tap`: a 10ms tick. Use for save, send, save-toggle - any
 *   light interaction that wants subtle confirmation.
 * - `success`: short double-tick. Reserve for completed flows
 *   (job posted, pro hired, password reset) so it stands out from
 *   ordinary taps.
 * - `error`: longer single pulse. Pair with destructive failures
 *   so users feel the error before reading the toast.
 * - `undo`: a 5ms tick. Acknowledges the user's "undo" reflex
 *   without competing with the original action's haptic.
 */
const PATTERNS = {
  tap: 10,
  success: [12, 60, 12] as number[],
  error: 40,
  undo: 5,
} as const;

type HapticPattern = keyof typeof PATTERNS;

/**
 * `useHaptic` returns a fire function that triggers the Vibration
 * API where supported, and silently no-ops everywhere else. iOS
 * Safari ignores `navigator.vibrate` (Apple policy); Android Chrome
 * and most Android browsers honor it. Calling it is always safe -
 * the spec mandates that unsupported devices return `false` rather
 * than throwing.
 *
 * The hook deliberately doesn't auto-fire on every keystroke or
 * scroll - too aggressive haptic is annoying. Wire it explicitly
 * to deliberate user actions (form submit, undo tap, save toggle).
 *
 * ```ts
 * const haptic = useHaptic();
 * await api.post(...);
 * haptic("success");
 * ```
 */
export function useHaptic() {
  return useCallback((pattern: HapticPattern = "tap") => {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      // Some platforms throw on rapid successive calls. Swallow -
      // a missed haptic is harmless.
    }
  }, []);
}
