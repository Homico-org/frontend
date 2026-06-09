"use client";

import { useEffect, useRef } from "react";

/**
 * Sentinel value stored on history state when a modal is open.
 * `popstate` events can read this to tell whether the back button
 * should close a modal (our entry) or actually navigate (theirs).
 */
const SENTINEL = "homiModal";

interface UseModalHistoryArgs {
  isOpen: boolean;
  onClose: () => void;
  /**
   * When true (default), pressing the browser/Android back button
   * while the modal is open will close it instead of navigating
   * away. Set to false for modals that intentionally block close
   * (e.g. during a critical save).
   */
  enabled?: boolean;
}

/**
 * Make a modal-style overlay react to the browser back button.
 *
 * On open: pushes a sentinel history entry so a `popstate` event
 * means "user tapped back."
 * On `popstate`: calls `onClose()` and consumes the sentinel.
 * On close (from any other path, eg. Escape, backdrop, X): pops
 * the sentinel via `history.back()` so the URL/history state
 * returns to its pre-open value.
 *
 * Why: on Android the system back button is the primary back
 * gesture, and without this hook tapping back while a modal is
 * open would navigate the underlying page away while the modal
 * stayed visible. This hook also makes the desktop browser back
 * button feel right.
 */
export function useModalHistory({ isOpen, onClose, enabled = true }: UseModalHistoryArgs) {
  const pushedRef = useRef(false);
  const closingFromPopRef = useRef(false);
  // Set right before WE call history.back() during teardown. In React 18 dev
  // Strict Mode a modal that mounts already-open is mounted -> unmounted ->
  // remounted; the teardown's history.back() fires a popstate that the
  // remounted listener would otherwise catch and treat as "user pressed back,"
  // closing the modal the instant it opens. This flag makes that one
  // self-induced popstate a no-op. Refs persist across the Strict remount, so
  // the guard survives; in production (no double-invoke) it never trips, so
  // behavior is unchanged. A genuine back press still closes the modal.
  const ignorePopRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    if (isOpen && !pushedRef.current) {
      // Tag the next history entry so we know it's ours. We use the
      // current URL on purpose - we don't want to change the visible
      // location; just need a stack entry to pop on back.
      window.history.pushState({ [SENTINEL]: true }, "", window.location.href);
      pushedRef.current = true;

      const handlePop = () => {
        if (ignorePopRef.current) {
          // Self-induced pop from a Strict-Mode teardown - swallow it.
          ignorePopRef.current = false;
          return;
        }
        closingFromPopRef.current = true;
        onClose();
      };
      window.addEventListener("popstate", handlePop);
      return () => {
        window.removeEventListener("popstate", handlePop);
      };
    }

    if (!isOpen && pushedRef.current) {
      // Modal was closed by something other than the back button
      // (Escape, backdrop, X). Consume our sentinel entry so the
      // history stack returns to its pre-open shape.
      pushedRef.current = false;
      if (!closingFromPopRef.current) {
        // Guard against double-pop edge cases by checking that the
        // current state is still ours before going back. The listener has
        // already been removed by the effect cleanup, so this back() can't
        // re-enter handlePop - no ignore flag needed here (setting it would
        // leave a stale guard that swallows the next real back press on an
        // always-mounted modal's reopen).
        if ((window.history.state as { [k: string]: unknown } | null)?.[SENTINEL]) {
          window.history.back();
        }
      }
      closingFromPopRef.current = false;
    }
  }, [isOpen, onClose, enabled]);

  // Safety: if the component unmounts while open, still tidy up so
  // we don't leak a sentinel that future popstates would misread.
  useEffect(() => {
    return () => {
      if (pushedRef.current && typeof window !== "undefined") {
        if ((window.history.state as { [k: string]: unknown } | null)?.[SENTINEL]) {
          ignorePopRef.current = true;
          window.history.back();
        }
        pushedRef.current = false;
      }
    };
  }, []);
}
