'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ContentType = 'jobs' | 'portfolio' | 'professionals';

interface ContentTypeSwitcherProps {
  isPro?: boolean;
}

export default function ContentTypeSwitcher({
  isPro = false,
}: ContentTypeSwitcherProps) {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  // Determine active tab from pathname
  const activeTab: ContentType = useMemo(() => {
    if (pathname.includes('/browse/jobs')) return 'jobs';
    if (pathname.includes('/browse/portfolio')) return 'portfolio';
    return 'professionals';
  }, [pathname]);

  const tabs = useMemo(() => [
    {
      key: 'jobs' as ContentType,
      route: '/browse/jobs',
      label: 'Jobs',
      labelKa: 'სამუშაო',
      showFor: 'pro' as const,
    },
    {
      key: 'portfolio' as ContentType,
      route: '/browse/portfolio',
      label: 'Portfolio',
      labelKa: 'ნამუშევრები',
      showFor: 'all' as const,
    },
    {
      key: 'professionals' as ContentType,
      route: '/browse/professionals',
      label: 'Pros',
      labelKa: 'პროები',
      showFor: 'all' as const,
    },
  ], []);

  const visibleTabs = useMemo(() =>
    tabs.filter(tab => tab.showFor === 'all' || (tab.showFor === 'pro' && isPro)),
    [tabs, isPro]
  );

  const getTabIcon = useCallback((key: ContentType) => {
    switch (key) {
      case 'jobs':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeLinecap="round" />
          </svg>
        );
      case 'portfolio':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'professionals':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeLinecap="round" />
          </svg>
        );
    }
  }, []);

  // Calculate indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const activeButton = buttonRefs.current.get(activeTab);
      const container = containerRef.current;

      if (activeButton && container) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();

        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    };

    const rafId = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    const timer = setTimeout(() => setMounted(true), 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, isPro]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex p-1 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]"
    >
      {/* Animated indicator */}
      <div
        className={`absolute top-1 bottom-1 rounded-md bg-[#E07B4F] ${mounted ? 'transition-all duration-300' : ''}`}
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Tab buttons */}
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <Link
            key={tab.key}
            href={tab.route}
            ref={(el) => {
              if (el) buttonRefs.current.set(tab.key, el);
            }}
            className={`
              relative z-10 flex items-center gap-1.5
              px-3 py-1.5 rounded-md
              text-xs font-medium
              transition-colors duration-200
              ${isActive
                ? 'text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }
            `}
          >
            {getTabIcon(tab.key)}
            <span>{locale === 'ka' ? tab.labelKa : tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
