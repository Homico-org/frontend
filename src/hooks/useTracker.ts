'use client';

import { api } from '@/lib/api';
import { useCallback } from 'react';

interface TrackItem {
  event: string;
  target: string;
  label?: string;
}

// Module-level queue shared across all component instances
let queue: TrackItem[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0);
  api.post('/analytics/track', { events: batch }).catch(() => {
    // Silently drop on failure — analytics should never block UX
  });
}

function flushBeacon() {
  if (queue.length === 0) return;
  const batch = queue.splice(0);
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/analytics/track`;
  const body = JSON.stringify({ events: batch });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
  }
}

// Start the flush interval once (module-level singleton)
if (typeof window !== 'undefined' && !flushTimer) {
  flushTimer = setInterval(flush, 30_000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushBeacon();
    }
  });
}

/** Standalone function for use outside React components */
export function trackEvent(event: string, target: string, label?: string) {
  queue.push({ event, target, ...(label ? { label } : {}) });
}

/** React hook — returns a stable `track` function */
export function useTracker() {
  const track = useCallback((event: string, target: string, label?: string) => {
    trackEvent(event, target, label);
  }, []);

  return { track };
}
