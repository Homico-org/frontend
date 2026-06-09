"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const RECENT_VISITS_KEY = "homi:recentVisits:v1";
const RECENT_VISITS_LIMIT = 5;
// Searches are typed (more deliberate signal of intent than a
// pageview) so persist across sessions via localStorage. A user
// who searched "plumber" yesterday usually wants to return to
// that search today.
const RECENT_SEARCHES_KEY = "homi:recentSearches:v1";
const RECENT_SEARCHES_LIMIT = 5;

/**
 * Read the recently-visited paths from sessionStorage. The command
 * palette reads this on open so users can jump back to where they
 * just were without re-typing. Synchronous + safe on SSR.
 */
export function getRecentVisits(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(RECENT_VISITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

function persistRecentVisits(paths: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RECENT_VISITS_KEY, JSON.stringify(paths));
  } catch {
    // Storage quota / private-mode lockouts - dropping the write
    // is fine; the palette just won't show recents.
  }
}

/**
 * Read the user's recent typed search queries. Stored across
 * sessions (localStorage) so a Monday search for "plumber" still
 * surfaces on Friday. Caller is responsible for tagging the query
 * via `recordRecentSearch` after the user actually searched.
 */
export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Append `query` to the recent-search list. Dedupes (most-recent
 * occurrence wins) and trims to `RECENT_SEARCHES_LIMIT`. Trims
 * whitespace + ignores empties so a stale onChange doesn't pollute.
 */
export function recordRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  if (trimmed.length < 2) return;
  try {
    const prev = getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const next = [trimmed, ...prev].slice(0, RECENT_SEARCHES_LIMIT);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // Quota / private-mode lockouts - safe to drop.
  }
}

/**
 * Tracks how many in-app navigations have happened since this tab was
 * opened. Stored on `window` so `backOrNavigate` in utils can read it
 * without taking a context dependency on the navigation tree.
 *
 * Why not use `window.history.length`? In the App Router that counter
 * starts at 1, never decreases, and never resets across cross-document
 * navigations. So a freshly opened tab with `history.length === 1`
 * could either be a deep link (where `router.back()` is a no-op) or a
 * page the user already navigated forward on. The browser API can't
 * tell us which.
 *
 * Our own counter only increments on app-internal pathname changes
 * (the URL path changed while this component stayed mounted), so a
 * positive value is a hard guarantee that there's at least one real
 * entry to go back to within the app.
 *
 * We deliberately ignore query-string-only changes so that filter
 * toggles (which use `router.replace` and don't push history) don't
 * pollute the back stack.
 *
 * ALSO: this provider triggers a View Transition on every pathname
 * change. Browsers that support it animate a smooth cross-fade
 * between routes; older browsers fall through to a snap-cut (no
 * regression). The transition is what makes back/forward feel like a
 * native app gesture instead of a hard reload visual.
 */
export default function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__homiInAppNavCount === undefined) {
      window.__homiInAppNavCount = 0;
    }
    if (initialPathRef.current === null) {
      // First mount in this tab. Record the entry path so subsequent
      // changes (real in-app nav) get counted.
      initialPathRef.current = pathname;
      return;
    }
    if (pathname !== initialPathRef.current) {
      window.__homiInAppNavCount = (window.__homiInAppNavCount ?? 0) + 1;
      initialPathRef.current = pathname;

      // Track recents so the command palette can surface them.
      // Skip the home page and the success / auth screens - they're
      // not interesting return destinations and would push real
      // pages out of the list.
      const shouldTrack =
        pathname !== "/" &&
        !pathname.endsWith("/success") &&
        !pathname.startsWith("/login") &&
        !pathname.startsWith("/register") &&
        !pathname.startsWith("/forgot-password");
      if (shouldTrack) {
        const prev = getRecentVisits().filter((p) => p !== pathname);
        const next = [pathname, ...prev].slice(0, RECENT_VISITS_LIMIT);
        persistRecentVisits(next);
      }
    }
  }, [pathname]);

  // View Transitions API. `useLayoutEffect` so the transition starts
  // before React commits the new pathname's DOM - otherwise we'd
  // animate from new state to itself. Feature-detected so legacy
  // browsers degrade to instant nav.
  const previousPathForTransitionRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const docAny = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    if (!docAny.startViewTransition) return;

    if (previousPathForTransitionRef.current === null) {
      previousPathForTransitionRef.current = pathname;
      return;
    }
    if (pathname === previousPathForTransitionRef.current) return;

    // Capture the about-to-render state. The DOM is already updated
    // by the time this effect fires (we're in layoutEffect of the
    // *new* render), so calling startViewTransition with a no-op
    // body still gives the browser a snapshot to cross-fade with.
    try {
      docAny.startViewTransition(() => {
        // Browser snapshots old + new states and cross-fades.
      });
    } catch {
      // Silently degrade if the browser refuses for any reason.
    }
    previousPathForTransitionRef.current = pathname;
  }, [pathname]);

  return <>{children}</>;
}
