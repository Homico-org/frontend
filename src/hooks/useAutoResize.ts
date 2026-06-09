"use client";

import { RefObject, useEffect } from "react";

/**
 * Make a `<textarea>` grow to fit its content, bounded by `maxRows`.
 * Common ask anywhere users write more than a sentence (proposals,
 * reviews, messages, AI chat). Fixed-height textareas force a tiny
 * inner scrollbar on mobile that's both ugly and hard to use.
 *
 * The hook clamps the height with min/max so the field still keeps
 * a sensible footprint at rest and never grows past `maxRows` of
 * text (after which an internal scrollbar takes over).
 *
 * ```tsx
 * const ref = useRef<HTMLTextAreaElement>(null);
 * useAutoResize(ref, value);
 * <textarea ref={ref} value={value} onChange={...} />
 * ```
 */
export function useAutoResize(
  ref: RefObject<HTMLTextAreaElement>,
  value: string | number | readonly string[] | undefined,
  options: { minRows?: number; maxRows?: number } = {},
) {
  const { minRows = 2, maxRows = 12 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Read the computed line-height so we measure correctly across
    // theme / font changes. Falls back to a sane default if the
    // browser returns "normal" (no numeric value).
    const lineHeight =
      parseFloat(window.getComputedStyle(el).lineHeight) || 20;
    const paddingY =
      parseFloat(window.getComputedStyle(el).paddingTop) +
      parseFloat(window.getComputedStyle(el).paddingBottom);
    const borderY =
      parseFloat(window.getComputedStyle(el).borderTopWidth) +
      parseFloat(window.getComputedStyle(el).borderBottomWidth);

    const minPx = lineHeight * minRows + paddingY + borderY;
    const maxPx = lineHeight * maxRows + paddingY + borderY;

    // Reset to auto first so scrollHeight reflects the natural size
    // of the current content, not a previously inflated value.
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, minPx), maxPx);
    el.style.height = `${next}px`;
    // Internal scrollbar shows up only past maxRows.
    el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
  }, [ref, value, minRows, maxRows]);
}
