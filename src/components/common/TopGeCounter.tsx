'use client';

import { useEffect, useRef } from 'react';

/**
 * TOP.GE public ranking counter (site-id 118847, registered for homico.ge).
 *
 * The counter script injects an <a> badge into the container. Loading it via a
 * raw async <script> in the server-rendered tree lets that injection race React
 * hydration ("Did not expect server HTML to contain a <a> in <div>"). So we
 * render an empty container that matches on the server + client, then append
 * the script ourselves in an effect - strictly after hydration - and mark the
 * container suppressHydrationWarning as belt-and-suspenders.
 */
export default function TopGeCounter() {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://counter.top.ge/counter.js';
    document.body.appendChild(s);
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
      <div
        id="top-ge-counter-container"
        data-site-id="118847"
        suppressHydrationWarning
      />
    </div>
  );
}
