"use client";

import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback } from "react";

interface ShareLinkPayload {
  /**
   * The URL to share. Pass an absolute URL (with origin) so the
   * shared text resolves correctly when opened on another device.
   */
  url: string;
  /**
   * Optional title for the native share sheet. Most apps render it
   * as the shared content's name. Falls through cleanly when the
   * sheet doesn't support it.
   */
  title?: string;
  /**
   * Optional descriptive text shown alongside the URL in the share
   * sheet (e.g. "Check out this pro on Homico").
   */
  text?: string;
  /**
   * Override the "copied" toast message. Defaults to the standard
   * `postJobSuccess.shareCopied` key ("Link copied" / "ლინკი
   * დაკოპირდა"). Pass an alternative i18n key for surface-specific
   * copy.
   */
  copiedKey?: string;
}

/**
 * Unified share-link handler: tries the native share sheet first
 * (mobile + some desktops), falls back to clipboard with a success
 * toast. Multiple surfaces across the app duplicated this pattern;
 * the hook collapses them into one consistent behavior so a fix
 * lands everywhere at once.
 *
 * Returns a memoized `share` function. Callers do nothing on user-
 * cancel (the spec throws AbortError but it isn't a failure).
 *
 * ```ts
 * const share = useShareLink();
 * <Button onClick={() => share({ url: `${origin}${jobUrl}`, title: job.title })}>
 *   Share
 * </Button>
 * ```
 */
export function useShareLink() {
  const toast = useToast();
  const { t } = useLanguage();

  return useCallback(
    async ({ url, title, text, copiedKey }: ShareLinkPayload) => {
      // Native share where supported (mobile + Edge / Safari).
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({ url, title, text });
          return;
        } catch (err) {
          // User cancelled the sheet - silent. The spec throws
          // AbortError on dismissal; treat as no-op so we don't
          // fall through to clipboard and confuse the user.
          if ((err as { name?: string })?.name === "AbortError") return;
          // Any other failure (permission denied, no app installed
          // to receive the payload, etc.) falls through to clipboard.
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t(copiedKey ?? "postJobSuccess.shareCopied"));
      } catch {
        toast.error(t("common.error"));
      }
    },
    [toast, t],
  );
}
