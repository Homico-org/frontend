'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Fires a Meta Pixel `PageView` on client-side (App Router) navigations.
 * The inline pixel snippet in the root layout already fires PageView on the
 * initial load, so the first effect run is skipped to avoid double-counting.
 */
export default function MetaPixelPageView() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') fbq('track', 'PageView');
  }, [pathname]);

  return null;
}
