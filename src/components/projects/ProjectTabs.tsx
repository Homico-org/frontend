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
 * Fancy segmented tab bar for the project page: a soft-elevated "pill"
 * slides under the active tab, the active icon + label lift into brand
 * color. Horizontally scrollable on narrow screens.
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
      className="scrollbar-hide relative flex gap-1 overflow-x-auto rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-1.5 shadow-[0_1px_2px_rgba(17,16,13,0.04)]"
    >
      {/* Sliding active pill - solid brand to match the rest of the UI */}
      <span
        aria-hidden
        className="absolute bottom-1.5 top-1.5 rounded-xl bg-[var(--hm-brand-500)] shadow-[0_2px_8px_-2px_rgba(239,78,36,0.4)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          left: pill.left,
          width: pill.width,
          opacity: pill.ready ? 1 : 0,
        }}
      />
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
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl py-2.5 text-[13px] font-semibold transition-colors duration-200 sm:justify-start sm:gap-2 sm:px-3.5',
              // Inactive tabs are centered square tap targets on phones (>=42px),
              // so the bar reads as a tidy button row, not stray icons. The
              // active tab keeps its label, so it grows past the square.
              active ? 'px-3.5 text-white' : 'min-w-[42px] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)] sm:min-w-0 sm:px-3.5',
            )}
          >
            <span
              className={cn(
                'flex items-center transition-transform duration-200',
                active ? 'scale-105' : 'scale-100',
              )}
            >
              {tab.icon}
            </span>
            {/* Inactive tabs collapse to icon-only on phones so all sections
                fit without the bar clipping; active keeps its label. */}
            <span className={cn(!active && 'hidden sm:inline')}>{tab.label}</span>
          </button>
        );
      })}
    </div>
      {/* Edge fades - appear only when there's more to scroll that way. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-1.5 left-1.5 w-8 rounded-l-xl transition-opacity duration-200"
        style={{
          background:
            'linear-gradient(to right, var(--hm-bg-elevated), transparent)',
          opacity: edges.left ? 1 : 0,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-1.5 right-1.5 w-8 rounded-r-xl transition-opacity duration-200"
        style={{
          background:
            'linear-gradient(to left, var(--hm-bg-elevated), transparent)',
          opacity: edges.right ? 1 : 0,
        }}
      />
    </div>
  );
}
