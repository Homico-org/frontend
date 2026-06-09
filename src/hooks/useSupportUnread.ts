'use client';

/**
 * Polls the support unread-summary endpoint so the header / profile dropdown
 * can show a "support replied" badge without the user having to open the
 * help page.
 *
 * Defensive rules baked in (previously the hook was a thoughtless setInterval
 * + every-focus refetch, which generated streams of 429s when the backend
 * tightened its rate limit):
 *
 *  - Skip polls while the tab is hidden (`document.visibilityState`). No
 *    point asking the backend about unread when the user can't see the
 *    badge anyway.
 *  - Debounce focus refetches with a minimum interval - rapid window
 *    blur/focus cycles (devtools open, alt-tab, etc.) used to fire one
 *    fetch each. Now coalesced to one fetch per MIN_INTERVAL_MS.
 *  - Exponential backoff on 429. Backend says "slow down" -> we double
 *    the next-attempt delay, up to MAX_BACKOFF_MS. A clean 200 resets it.
 *  - The two existing callers (Header + /help page) each run their own
 *    interval; nothing to do about that without introducing a shared
 *    context, but the rate-limit awareness above keeps the combined
 *    rate inside the backend's tolerance.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback, useRef } from 'react';

interface UnreadSummary {
  count: number;
  ticketIds: string[];
}

const POLL_MS = 60_000;
// Minimum gap between two refetches triggered by focus/visibility events
// or the support:read custom event. Without this, a single user action
// could produce 3-4 fetches in a few hundred milliseconds.
const MIN_INTERVAL_MS = 5_000;
// 429 backoff schedule. Starts at 30s, doubles per consecutive 429, caps
// at 10 min. A successful 200 response resets to POLL_MS.
const INITIAL_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 10 * 60_000;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useSupportUnread(): {
  count: number;
  ticketIds: string[];
  firstUnreadId: string | null;
  refresh: () => void;
} {
  const { token, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<UnreadSummary>({ count: 0, ticketIds: [] });

  // Refs (not state) so we don't re-run the polling effect on every value
  // change - they're just internal bookkeeping for the next-fetch timing.
  const lastFetchAtRef = useRef<number>(0);
  const backoffMsRef = useRef<number>(POLL_MS);
  const inFlightRef = useRef<boolean>(false);

  const fetchUnread = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    // Don't fetch while the tab is hidden - the user can't see the badge.
    if (typeof document !== 'undefined' && document.hidden) return;
    // Coalesce rapid call sites (focus + support:read fired together).
    if (inFlightRef.current) return;
    const now = Date.now();
    if (now - lastFetchAtRef.current < MIN_INTERVAL_MS) return;
    lastFetchAtRef.current = now;
    inFlightRef.current = true;
    try {
      const res = await fetch(`${API_URL}/support/tickets/my/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 429) {
        // Backend rate-limited us. Push the next attempt out
        // exponentially so we stop pestering until it's safe.
        backoffMsRef.current = Math.min(
          backoffMsRef.current * 2,
          MAX_BACKOFF_MS,
        );
        return;
      }
      if (!res.ok) return;
      const data = (await res.json()) as UnreadSummary;
      setSummary(data);
      // Clean response - reset to normal cadence in case we had been
      // backed off.
      backoffMsRef.current = POLL_MS;
    } catch {
      // Network errors are non-fatal - the badge just stays at its last value
    } finally {
      inFlightRef.current = false;
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSummary({ count: 0, ticketIds: [] });
      return;
    }
    fetchUnread();
    // Self-rescheduling timeout chain (not setInterval) so we can adapt
    // the next delay based on the most recent backoff state. setInterval
    // is fire-and-forget; we want the cadence to grow when the backend
    // pushes back.
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      if (cancelled) return;
      fetchUnread();
      timerId = setTimeout(tick, backoffMsRef.current);
    };
    timerId = setTimeout(tick, backoffMsRef.current);
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [isAuthenticated, fetchUnread]);

  // Refresh when the tab regains focus or becomes visible. The
  // MIN_INTERVAL_MS guard inside fetchUnread keeps these from firing
  // in burst when a user rapidly alt-tabs.
  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => fetchUnread();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };
    // Custom event dispatched by the support ticket pages (admin/support,
    // /help/ticket/[id]) right after calling /read. Without it the badge
    // would sit stale for up to POLL_MS even though the user is actively
    // reading the ticket.
    const onSupportRead = () => fetchUnread();
    window.addEventListener('focus', onFocus);
    window.addEventListener('support:read', onSupportRead);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('support:read', onSupportRead);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, fetchUnread]);

  return {
    count: summary.count,
    ticketIds: summary.ticketIds,
    firstUnreadId: summary.ticketIds[0] ?? null,
    refresh: fetchUnread,
  };
}
