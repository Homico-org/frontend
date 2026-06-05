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
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });

  const measure = useCallback(() => {
    const el = refs.current[activeTab];
    if (el) {
      setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    }
  }, [activeTab]);

  // Position the pill once layout is known (no first-paint flash).
  useLayoutEffect(measure, [measure, tabs.length]);

  // Keep the pill aligned on resize / font load.
  useEffect(() => {
    window.addEventListener('resize', measure);
    const id = window.setTimeout(measure, 150); // after webfont swap
    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(id);
    };
  }, [measure]);

  // On mobile the bar scrolls - keep the active tab in view when it changes.
  useEffect(() => {
    refs.current[activeTab]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeTab]);

  return (
    <div
      role="tablist"
      aria-label="Project sections"
      className={cn(
        'scrollbar-hide relative flex gap-1 overflow-x-auto rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-1.5 shadow-[0_1px_2px_rgba(17,16,13,0.04)]',
        className,
      )}
    >
      {/* Sliding active pill - solid brand, soft glow */}
      <span
        aria-hidden
        className="absolute bottom-1.5 top-1.5 rounded-xl bg-gradient-to-b from-[var(--hm-brand-500)] to-[var(--hm-brand-600)] shadow-[0_2px_6px_-1px_rgba(239,78,36,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
              'relative z-10 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200',
              active
                ? 'text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.12)]'
                : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)]',
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
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
