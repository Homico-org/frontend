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
      label: 'Opportunities',
      labelKa: 'სამუშაოები',
      description: 'Find projects',
      descriptionKa: 'სამუშაოების ძებნა',
      showFor: 'pro' as const,
    },
    {
      key: 'portfolio' as ContentType,
      route: '/browse/portfolio',
      label: 'Portfolio',
      labelKa: 'სხვების ნამუშევრები',
      description: 'View work samples',
      descriptionKa: 'სხვების ნამუშევრების ნახვა',
      showFor: 'all' as const,
    },
    {
      key: 'professionals' as ContentType,
      route: '/browse/professionals',
      label: 'Professionals',
      labelKa: 'სპეციალისტები',
      description: 'Browse experts',
      descriptionKa: 'სპეციალისტების დათვალიერება',
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
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeLinecap="round" />
            <path d="M12 11v4m0 0l2-2m-2 2l-2-2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'portfolio':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'professionals':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeLinecap="round" />
            <circle cx="17" cy="11" r="2.5" />
            <path d="M21 21v-1.5a3 3 0 00-3-3h-.5" strokeLinecap="round" />
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

    // Small delay to ensure refs are set
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
    <div className="w-full">
      {/* Premium switcher container */}
      <div
        ref={containerRef}
        className="relative inline-flex w-full p-1.5 rounded-2xl switcher-container"
      >
        {/* Animated indicator */}
        <div
          className={`switcher-indicator z-0 top-1.5 bottom-1.5 ${mounted ? 'transition-all duration-400' : ''}`}
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                relative z-10 flex-1 flex items-center justify-center gap-2 sm:gap-2.5
                px-3 sm:px-6 py-3 sm:py-4 rounded-xl
                font-medium text-xs sm:text-sm
                transition-all duration-300 ease-out
                touch-manipulation
                ${isActive
                  ? 'text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[#D2691E] dark:hover:text-[#CD853F]'
                }
              `}
            >
              <span className={`
                transition-transform duration-300
                ${isActive ? 'scale-110' : 'group-hover:scale-105'}
              `}>
                {getTabIcon(tab.key)}
              </span>
              <span className="hidden xs:inline sm:inline font-semibold tracking-tight">
                {locale === 'ka' ? tab.labelKa : tab.label}
              </span>
              {/* Mobile: show just icon, tablet+: show label */}
              <span className="xs:hidden sm:hidden font-semibold tracking-tight">
                {locale === 'ka' ? tab.labelKa.slice(0, 6) : tab.label.slice(0, 6)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Subtle description line */}
      <div className="mt-2 flex justify-center">
        <p className="font-serif-italic text-xs sm:text-sm text-[var(--color-text-tertiary)]">
          {locale === 'ka'
            ? visibleTabs.find(t => t.key === activeTab)?.descriptionKa
            : visibleTabs.find(t => t.key === activeTab)?.description
          }
        </p>
      </div>
    </div>
  );
}
