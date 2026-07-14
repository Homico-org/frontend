'use client';

import { cn } from '@/lib/utils';
import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export interface ProjectTab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface ProjectTabsProps {
  tabs: ProjectTab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Project page tab bar: a 2px vermillion underline slides under the active tab
 * (design system §3.4 / §6 - underline, never a tinted pill). Sits flat on the
 * page ground with a single bottom hairline; horizontally scrollable on narrow
 * screens with edge fades.
 */
export default function ProjectTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: ProjectTabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  // Edge fades so the bar reads as swipeable, not clipped, on narrow screens.
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setEdges({
      left: scrollLeft > 4,
      right: scrollLeft + clientWidth < scrollWidth - 4,
    });
  }, []);

  const measure = useCallback(() => {
    const el = refs.current[activeTab];
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    }
  }, [activeTab]);

  // Position the pill once layout is known (no first-paint flash).
  useLayoutEffect(measure, [measure, tabs.length]);

  // Keep the pill aligned + edge fades current on resize / font load.
  useEffect(() => {
    const onResize = () => {
      measure();
      updateEdges();
    };
    window.addEventListener('resize', onResize);
    const id = window.setTimeout(onResize, 150); // after webfont swap
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(id);
    };
  }, [measure, updateEdges]);

  // On mobile the bar scrolls - keep the active tab in view when it changes.
  useEffect(() => {
    refs.current[activeTab]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeTab]);

  return (
    <div className={cn('relative', className)}>
    <div
      ref={listRef}
      role="tablist"
      aria-label="Project sections"
      onScroll={updateEdges}
      className="scrollbar-hide relative flex gap-1 overflow-x-auto border-b border-[var(--hm-border-subtle)]"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap py-3 text-[13px] font-semibold transition-colors duration-200 sm:justify-start sm:gap-2 sm:px-3',
              // Inactive tabs collapse to a centered icon-only tap target on
              // phones (>=42px) so the bar reads as a tidy row; active keeps its
              // label. Active = brand ink, matching the sliding underline.
              active
                ? 'px-3 text-[var(--hm-brand-500)]'
                : 'min-w-[42px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)] sm:min-w-0 sm:px-3',
            )}
          >
            <span className="flex items-center">{tab.icon}</span>
            <span className={cn(!active && 'hidden sm:inline')}>{tab.label}</span>
          </button>
        );
      })}
      {/* Sliding 2px vermillion underline under the active tab (§3.4 / §6). */}
      <span
        aria-hidden
        className="absolute bottom-0 h-[2px] bg-[var(--hm-brand-500)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          left: pill.left,
          width: pill.width,
          opacity: pill.ready ? 1 : 0,
        }}
      />
    </div>
      {/* Edge fades - appear only when there's more to scroll that way. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-8 transition-opacity duration-200"
        style={{
          background:
            'linear-gradient(to right, var(--hm-bg-page), transparent)',
          opacity: edges.left ? 1 : 0,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 transition-opacity duration-200"
        style={{
          background:
            'linear-gradient(to left, var(--hm-bg-page), transparent)',
          opacity: edges.right ? 1 : 0,
        }}
      />
    </div>
  );
}
