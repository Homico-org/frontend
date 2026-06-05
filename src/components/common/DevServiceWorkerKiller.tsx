'use client';

import { useEffect } from 'react';

/**
 * In development, eagerly unregister any leftover service worker and wipe its
 * caches. next-pwa is disabled in dev, but a worker registered during a prior
 * production / local-prod run keeps intercepting requests and serving stale
 * bundles - which looks like "my code change had no effect". Renders nothing
 * and is a no-op in production.
 */
export default function DevServiceWorkerKiller() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        if (regs.length === 0) return;
        regs.forEach((r) => r.unregister());
        if (typeof caches !== 'undefined') {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
