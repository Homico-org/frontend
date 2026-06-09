"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Synchronously read a saved form draft from sessionStorage. Used as
 * the initial-value source for `useState` so the very first render
 * already shows the saved values - no flicker from defaults.
 */
export function getFormDraft<T>(key: string, enabled = true): T | null {
  if (!enabled) return null;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Manually wipe a draft, e.g. after successful submit or when the
 * user chooses "Start over".
 */
export function clearFormDraft(key: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Quota errors are harmless here; the next session start will
    // just see no saved draft and start fresh.
  }
}

/**
 * Persist a serializable form state to sessionStorage, debounced.
 * Pair with `getFormDraft<T>(key)` at component mount to round-trip
 * the data without flicker.
 *
 * Why sessionStorage (not localStorage):
 * - It's tab-scoped, so two tabs don't fight over the same draft
 * - It clears automatically when the tab closes, so abandoned
 *   drafts don't pile up
 * - Same domain rules apply, so private data isn't shared cross-tab
 *
 * Why not auto-restore via the hook directly: synchronous reads
 * inside the parent's `useState` initializer keep the first paint
 * correct. The hook only owns the *save* side.
 */
export function useFormDraft<T>(key: string, value: T, enabled = true) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Skip the very first effect tick. We just hydrated from the
  // draft we're about to overwrite - no need to write it back the
  // same millisecond.
  const firstWriteSkippedRef = useRef(false);

  useEffect(() => {
    if (!enabledRef.current) return;
    if (typeof window === "undefined") return;
    if (!firstWriteSkippedRef.current) {
      firstWriteSkippedRef.current = true;
      return;
    }
    // Debounce so a stream of keystrokes doesn't write the whole
    // form to disk 30 times a second.
    const handle = window.setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        // sessionStorage quota / private-mode lockouts: dropping
        // a draft save is fine, we just lose persistence for this
        // tab. No need to surface to the user.
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [key, value]);
}

/**
 * Convenience hook for "does a draft exist?" - drives the resume
 * banner UI. Reads once on mount; doesn't re-check across renders
 * (the parent owns the actual state and any subsequent edits).
 */
export function useHasFormDraft(key: string, enabled = true) {
  const [hasDraft] = useState(() => getFormDraft(key, enabled) !== null);
  return hasDraft;
}
