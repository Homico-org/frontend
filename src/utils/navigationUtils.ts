"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Go back if the browser history stack has an entry; otherwise navigate to a fallback path.
 * Useful for direct-entry pages (new tab, deep link) where router.back() would do nothing.
 */
export function backOrNavigate(router: AppRouterInstance, fallbackPath: string) {
  if (typeof window === "undefined") {
    router.push(fallbackPath);
    return;
  }

  // history.length includes the current entry; "1" usually means no back history in this tab.
  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.push(fallbackPath);
}

