"use client";

import { useNotifications } from "@/contexts/NotificationContext";
import { useEffect, useRef } from "react";

/**
 * Prepends a `"(N) "` unread counter to the browser tab title when
 * the user has unread notifications. Users tabbed away to email /
 * chat / wherever now see at a glance that something new arrived,
 * without us needing a service-worker or push permission.
 *
 * Coexistence concern: a handful of pages set `document.title`
 * themselves on mount (e.g. `users/[id]/page.tsx`,
 * `JobDetailClient.tsx`). This component must NOT clobber those - it
 * has to read whatever those pages set and prepend the badge to
 * THAT. Implementation:
 *
 *   1. Watch `document.title` via MutationObserver. Whenever it
 *      changes (a route change set a new title), capture the
 *      "clean" title (the part without our prefix).
 *   2. Recompute `(N) ${clean}` and write back when unread changes.
 *   3. Use a regex to detect / strip our own prefix on read so we
 *      don't double-prefix or treat our prefix as part of the
 *      clean title.
 *
 * Mount once in the root layout. Self-contained, no provider.
 */
const PREFIX_RE = /^\(\d+\) /;

export default function UnreadTabTitle() {
  const { unreadCount } = useNotifications();
  // Latest count + clean-title in refs so the MutationObserver
  // callback can read fresh values without re-binding.
  const unreadRef = useRef(unreadCount);
  unreadRef.current = unreadCount;
  const cleanTitleRef = useRef<string>(
    typeof document !== "undefined" ? document.title.replace(PREFIX_RE, "") : "",
  );

  // Reapply the prefix whenever the unread count changes. Uses the
  // last-known clean title from the MutationObserver below.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const clean = cleanTitleRef.current || document.title.replace(PREFIX_RE, "");
    const next = unreadCount > 0 ? `(${unreadCount}) ${clean}` : clean;
    if (document.title !== next) document.title = next;
  }, [unreadCount]);

  // Track external title changes (page navigation, custom
  // `document.title = ...` from a page component). When the new
  // title is anything OTHER than our currently-applied prefixed
  // value, treat it as a fresh clean title.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const titleEl = document.querySelector("title");
    if (!titleEl) return;

    const observer = new MutationObserver(() => {
      const current = document.title;
      // If a page set the title to something that doesn't carry our
      // prefix, that's the new clean title. If it carries our
      // prefix already (e.g. we just wrote it), ignore - prevents
      // an infinite observer / write loop.
      if (PREFIX_RE.test(current)) return;
      cleanTitleRef.current = current;
      // Reapply our prefix on top of the new clean title.
      if (unreadRef.current > 0) {
        document.title = `(${unreadRef.current}) ${current}`;
      }
    });
    observer.observe(titleEl, { childList: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
