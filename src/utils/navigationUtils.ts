"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { UserRole } from "@/types";

/**
 * Minimal shape we need from the auth user to decide a fallback. Kept
 * loose so callers can pass `useAuth().user` (which carries extras we
 * don't care about here) without having to project.
 */
export interface BackFallbackUser {
  role?: UserRole;
}

/**
 * Role-aware "where should this user end up if there's nowhere to go
 * back to?" helper. Used as the default fallback for `BackButton` and
 * `backOrNavigate` when callers don't pass an explicit path.
 *
 * The old default was a hardcoded `/portfolio`, which is a pro-only
 * route - a client landing there gets bounced back to `/` by the
 * AuthGuard with no toast. Pick a sensible "home" per role instead.
 */
export function defaultBackFallback(user: BackFallbackUser | null | undefined): string {
  if (!user) return "/";
  switch (user.role) {
    case UserRole.ADMIN:
      return "/admin";
    case UserRole.PRO:
      return "/my-space";
    case UserRole.CLIENT:
      return "/professionals";
    default:
      return "/";
  }
}

/**
 * Internal in-app navigation stack maintained by `NavigationProvider`.
 * `window.history.length` lies in App Router (it inflates with soft
 * nav and never resets), so we keep our own counter of "have we made
 * at least one in-app navigation since boot." Any positive count means
 * `router.back()` will move the user *within* the app, not yeet them
 * out of the tab.
 */
declare global {
  interface Window {
    __homiInAppNavCount?: number;
  }
}

function hasInAppHistory(): boolean {
  if (typeof window === "undefined") return false;
  return (window.__homiInAppNavCount ?? 0) > 0;
}

/**
 * Go back if the user navigated into the current page from somewhere
 * inside our app; otherwise navigate to the fallback path. Safe for
 * direct-entry pages (new tab, deep link, push notification) where
 * `router.back()` would otherwise be a silent no-op or pull the user
 * out of the tab to whatever site referred them.
 */
export function backOrNavigate(router: AppRouterInstance, fallbackPath: string) {
  if (typeof window === "undefined") {
    router.push(fallbackPath);
    return;
  }

  if (hasInAppHistory()) {
    router.back();
    return;
  }

  router.push(fallbackPath);
}
