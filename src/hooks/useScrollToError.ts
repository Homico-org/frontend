"use client";

import { useCallback } from "react";

/**
 * Find the first invalid element on the page and scroll it into
 * view, centered vertically with focus moved to it.
 *
 * Forms that span more than one viewport often fail silently after a
 * submit: the user sees the submit button do nothing, but the
 * validation error is rendered ~600px above off-screen and they
 * never see it. Call `scrollToFirstError()` from your submit handler
 * after running validation to guarantee the user sees what's wrong.
 *
 * Looks for elements in this priority order:
 *   1. `[data-error="true"]` - explicit error markers
 *   2. `[aria-invalid="true"]` - native a11y signal
 *   3. `.error` class wrappers - legacy callers
 *
 * `containerSelector` lets you scope the search (e.g. a modal
 * body) so a sibling form doesn't steal focus.
 */
export function useScrollToError(containerSelector?: string) {
  return useCallback(() => {
    if (typeof window === "undefined") return false;
    const root = containerSelector
      ? (document.querySelector(containerSelector) as HTMLElement | null)
      : document;
    if (!root) return false;

    const selectors = [
      '[data-error="true"]',
      '[aria-invalid="true"]',
      '.field-error',
    ].join(", ");

    const target = root.querySelector(selectors) as HTMLElement | null;
    if (!target) return false;

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    // If the error marker is a form control (input/textarea), focus
    // it so the user can immediately correct it. For non-input
    // markers we just leave focus alone - moving focus to a wrapping
    // div would steal it without giving the user anywhere useful to
    // type.
    const focusable = target.matches("input, textarea, select")
      ? target
      : (target.querySelector("input, textarea, select") as HTMLElement | null);
    if (focusable) {
      // Slight delay so smooth-scroll completes before focus jolts
      // the viewport.
      window.setTimeout(() => focusable.focus({ preventScroll: true }), 250);
    }
    return true;
  }, [containerSelector]);
}

/**
 * Non-hook variant for callers outside React (e.g. form-utility
 * modules). Same behavior; just imperative.
 */
export function scrollToFirstError(containerSelector?: string): boolean {
  if (typeof window === "undefined") return false;
  const root = containerSelector
    ? (document.querySelector(containerSelector) as HTMLElement | null)
    : document;
  if (!root) return false;

  const selectors = [
    '[data-error="true"]',
    '[aria-invalid="true"]',
    '.field-error',
  ].join(", ");

  const target = root.querySelector(selectors) as HTMLElement | null;
  if (!target) return false;

  target.scrollIntoView({ behavior: "smooth", block: "center" });

  const focusable = target.matches("input, textarea, select")
    ? target
    : (target.querySelector("input, textarea, select") as HTMLElement | null);
  if (focusable) {
    window.setTimeout(() => focusable.focus({ preventScroll: true }), 250);
  }
  return true;
}
