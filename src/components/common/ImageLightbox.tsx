"use client";

import { useModalHistory } from "@/hooks/useModalHistory";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
  /** Whether the lightbox is shown. */
  isOpen: boolean;
  /** Close handler - fires on backdrop / X / Esc / Android back. */
  onClose: () => void;
  /**
   * One or more image URLs. When the array has multiple entries the
   * lightbox renders prev/next arrows + keyboard navigation across
   * them. Single-image use cases just pass `[url]`.
   */
  images: string[];
  /**
   * Index in `images` to open at. Subsequent prev/next navigation
   * updates internal state; the parent doesn't need to track it.
   */
  initialIndex?: number;
  /**
   * Optional accessible label for the dialog. Defaults to a generic
   * "Image preview" - pass surface-specific text where available.
   */
  ariaLabel?: string;
}

/**
 * Full-screen image viewer modal. Replaces the previous "open image
 * in new tab" anchor pattern which dropped users out of the app
 * onto a raw image with no chrome - the new tab UX read as
 * unfinished.
 *
 * Behavior:
 *  - ESC, backdrop click, or X button close it
 *  - Browser/Android back button closes it (via useModalHistory)
 *  - When `images.length > 1`: arrow keys + on-screen arrows
 *    navigate the carousel
 *  - "Open in tab" link at the bottom-right for users who actually
 *    want the raw image (download, share to email, etc.)
 *
 * Pinch-to-zoom is intentionally handled by the browser's native
 * pinch on the `<img>` itself (no preventDefault on touchstart/move),
 * so mobile users keep the gesture without a custom touch handler.
 */
export default function ImageLightbox({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  ariaLabel = "Image preview",
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Snap to the requested initial index whenever the lightbox opens.
  // Without this, reopening for a different image in the same series
  // would still show whatever index the user last navigated to.
  useEffect(() => {
    if (isOpen) setIndex(initialIndex);
  }, [isOpen, initialIndex]);

  const hasMany = images.length > 1;

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation - arrow keys flip through the series, Esc
  // closes. Skipped when there's only one image; arrow keys do
  // nothing useful there.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (!hasMany) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, hasMany, goPrev, goNext, onClose]);

  // Browser/Android back closes the lightbox instead of navigating
  // away. Same hook every other modal-style overlay uses.
  useModalHistory({ isOpen, onClose });

  // Lock body scroll while open so background isn't scrollable
  // behind the lightbox.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;
  const current = images[index];
  if (!current) return null;

  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      {/* Backdrop - tap-to-close. Dimmer than the regular modal
          backdrop because the content is photographic; we want the
          image to read against deep black, not bg-tinted grey. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-fade-backdrop cursor-zoom-out"
      />

      {/* Close button - top-right corner. Generous tap target. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* "Open in tab" escape hatch - users who actually want the
          raw image for download / external share keep the
          previously-default behavior available. */}
      <a
        href={current}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Open image in new tab"
        className="absolute bottom-4 right-4 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Open in tab</span>
      </a>

      {/* Prev / next arrows - only when there's a series. Click
          stops propagation so the backdrop doesn't catch it. */}
      {hasMany && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous image"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          {/* Counter pill - hint that there's more to navigate. */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium">
            {index + 1} / {images.length}
          </div>
        </>
      )}

      {/* The image itself. Stop click propagation so tapping the
          photo doesn't fall through to the backdrop and close. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- Lightbox image is intentionally unoptimized; native img + browser pinch-zoom is the right primitive here. */}
      <img
        src={current}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="relative z-0 max-w-[92vw] max-h-[88vh] object-contain animate-fade-in"
        // Allow the browser's native pinch + double-tap zoom on
        // mobile by NOT setting touch-action: none here.
      />
    </div>
  );

  return createPortal(node, document.body);
}
