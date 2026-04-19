'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Homico Design System — Tabs
 * Underline: 2px bottom border brand-500 on active
 * Pills: brand-50 bg / brand-700 text on active
 */
const tabsContainerVariants = cva('relative flex', {
  variants: {
    variant: {
      default: 'border-b border-[var(--hm-border)]',
      pills: 'gap-[2px] p-1 bg-[var(--hm-bg-tertiary)]',
      underline: 'gap-1 border-b border-[var(--hm-border)]',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const tabVariants = cva(
  'relative flex items-center justify-center gap-2 font-medium transition-all whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'px-4 py-3 text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]',
        pills: 'px-4 py-2 text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]',
        underline: 'px-4 py-3 text-[var(--hm-fg-secondary)] hover:text-[var(--hm-fg-primary)]',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        active: true,
        className: 'text-[var(--hm-brand-500)]',
      },
      {
        variant: 'pills',
        active: true,
        className: 'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] shadow-[var(--hm-shadow-xs)]',
      },
      {
        variant: 'underline',
        active: true,
        className: 'text-[var(--hm-brand-500)]',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      active: false,
    },
  }
);

export interface Tab {
  id: string;
  label: string;
  shortLabel?: string; // Shorter label for mobile
  icon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface TabsProps extends VariantProps<typeof tabsContainerVariants> {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
  fullWidth?: boolean;
  scrollable?: boolean;
  compact?: boolean; // Use shortLabel on mobile if available
}

/**
 * Tabs navigation component
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  className,
  tabClassName,
  fullWidth = false,
  scrollable = false,
  compact = false,
}: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  // Update indicator position when active tab changes
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeTabRef = tabRefs.current[activeIndex];

    if (activeTabRef && (variant === 'default' || variant === 'underline')) {
      setIndicatorStyle({
        left: activeTabRef.offsetLeft,
        width: activeTabRef.offsetWidth,
      });
    }
  }, [activeTab, tabs, variant]);

  return (
    <div
      className={cn(
        tabsContainerVariants({ variant, size }),
        scrollable && 'overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={(el) => {
            tabRefs.current[index] = el;
          }}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            tabVariants({ variant, size, active: activeTab === tab.id }),
            fullWidth && 'flex-1',
            tab.disabled && 'opacity-50 cursor-not-allowed',
            tabClassName
          )}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          {compact && tab.shortLabel ? (
            <span>{tab.shortLabel}</span>
          ) : (
            <span>{tab.label}</span>
          )}
          {tab.badge !== undefined && (
            <span
              className={cn(
                'flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-medium tracking-[0.04em] rounded-full',
                activeTab === tab.id
                  ? 'bg-[var(--hm-brand-500)] text-white'
                  : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
              )}
              style={{ fontFamily: 'var(--hm-font-mono)' }}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}

      {/* Animated 2px brand-500 underline for default & underline variants */}
      {(variant === 'default' || variant === 'underline') && (
        <div
          className="absolute bottom-0 h-0.5 bg-[var(--hm-brand-500)] transition-all duration-300 ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      )}
    </div>
  );
}

export interface TabPanelProps {
  children: ReactNode;
  tabId: string;
  activeTab: string;
  className?: string;
}

/**
 * Tab panel content wrapper
 */
export function TabPanel({
  children,
  tabId,
  activeTab,
  className,
}: TabPanelProps) {
  if (tabId !== activeTab) return null;

  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}

export default Tabs;
