'use client';

/**
 * Polls the support unread-summary endpoint so the header / profile dropdown
 * can show a "support replied" badge without the user having to open the
 * help page. Polling cadence is conservative (60s) since support replies
 * are not high-frequency events and we don't want chatty network.
 *
 * Returns { count, ticketIds, firstUnreadId }. When the user navigates to
 * an unread ticket and reads it, the page-level `markAsRead` call updates
 * the backend; the next poll picks up the new zero.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';

interface UnreadSummary {
  count: number;
  ticketIds: string[];
}

const POLL_MS = 60_000;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useSupportUnread(): {
  count: number;
  ticketIds: string[];
  firstUnreadId: string | null;
  refresh: () => void;
} {
  const { token, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<UnreadSummary>({ count: 0, ticketIds: [] });

  const fetchUnread = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/support/tickets/my/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as UnreadSummary;
      setSummary(data);
    } catch {
      // Network errors are non-fatal - the badge just stays at its last value
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSummary({ count: 0, ticketIds: [] });
      return;
    }
    fetchUnread();
    const id = setInterval(fetchUnread, POLL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, fetchUnread]);

  // Also refresh when the tab regains focus - catches the case where a user
  // switches back to the app after support replied while they were elsewhere.
  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => fetchUnread();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isAuthenticated, fetchUnread]);

  return {
    count: summary.count,
    ticketIds: summary.ticketIds,
    firstUnreadId: summary.ticketIds[0] ?? null,
    refresh: fetchUnread,
  };
}
