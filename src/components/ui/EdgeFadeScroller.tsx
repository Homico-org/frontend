'use client';

import { cn } from '@/lib/utils';
import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface EdgeFadeScrollerProps {
  children: ReactNode;
  /** Class for the inner scroll track (e.g. flex gap padding). */
  className?: string;
  /** Class for the outer wrapper. */
  wrapperClassName?: string;
  /** Color the edges fade into - match the row's background. */
  fadeColor?: string;
  /** Fade width in px. */
  fadeWidth?: number;
}

/**
 * Wraps a horizontally-scrollable row and shows a soft fade at whichever edge
 * has more content, so the row reads as swipeable instead of clipped. The
 * fades are pointer-transparent and only appear when there's overflow in that
 * direction. Pure presentation - drop it around any pill/tab/chip row.
 */
export default function EdgeFadeScroller({
  children,
  className,
  wrapperClassName,
  fadeColor = 'var(--hm-bg-page)',
  fadeWidth = 28,
}: EdgeFadeScrollerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setEdges({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    window.addEventListener('resize', update);
    // Re-measure after webfont swap / late content.
    const id = window.setTimeout(update, 200);
    return () => {
      window.removeEventListener('resize', update);
      window.clearTimeout(id);
    };
  }, [update]);

  return (
    <div className={cn('relative', wrapperClassName)}>
      <div
        ref={ref}
        onScroll={update}
        className={cn('scrollbar-hide overflow-x-auto', className)}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 transition-opacity duration-200"
        style={{
          width: fadeWidth,
          background: `linear-gradient(to right, ${fadeColor}, transparent)`,
          opacity: edges.left ? 1 : 0,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 transition-opacity duration-200"
        style={{
          width: fadeWidth,
          background: `linear-gradient(to left, ${fadeColor}, transparent)`,
          opacity: edges.right ? 1 : 0,
        }}
      />
    </div>
  );
}
