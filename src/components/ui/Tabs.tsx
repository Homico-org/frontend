'use client';

import { ReactNode, useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Stable id helper for ARIA references between tabs and panels.
const tabId = (groupId: string, id: string) => `${groupId}-tab-${id}`;
const panelId = (groupId: string, id: string) => `${groupId}-panel-${id}`;

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
  /** Group identifier used to scope ARIA ids across tab/panel pairs. */
  groupId?: string;
  /** Accessible label for the tablist; defaults to "Tabs". */
  ariaLabel?: string;
}

/**
 * Tabs navigation component (WAI-ARIA tabs pattern with arrow-key navigation).
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
  groupId = 'tabs',
  ariaLabel = 'Tabs',
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

  // Keyboard navigation per WAI-ARIA tabs pattern: Left/Right cycle, Home/End jump.
  // Skips disabled tabs. Moving focus also activates the tab (automatic activation).
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const enabledIndices = tabs
        .map((tab, i) => (tab.disabled ? -1 : i))
        .filter((i) => i !== -1);
      if (enabledIndices.length === 0) return;

      const positionInEnabled = enabledIndices.indexOf(currentIndex);
      let targetIndex: number | undefined;

      switch (e.key) {
        case 'ArrowRight': {
          const next = (positionInEnabled + 1) % enabledIndices.length;
          targetIndex = enabledIndices[next];
          break;
        }
        case 'ArrowLeft': {
          const prev =
            (positionInEnabled - 1 + enabledIndices.length) % enabledIndices.length;
          targetIndex = enabledIndices[prev];
          break;
        }
        case 'Home':
          targetIndex = enabledIndices[0];
          break;
        case 'End':
          targetIndex = enabledIndices[enabledIndices.length - 1];
          break;
        default:
          return;
      }

      if (targetIndex === undefined) return;
      e.preventDefault();
      onChange(tabs[targetIndex].id);
      tabRefs.current[targetIndex]?.focus();
    },
    [tabs, onChange],
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={cn(
        tabsContainerVariants({ variant, size }),
        scrollable && 'overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={tabId(groupId, tab.id)}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={panelId(groupId, tab.id)}
            // Roving tabindex: only the active tab is in the natural tab order.
            // Arrow keys move between tabs once focus is in the tablist.
            tabIndex={isActive ? 0 : -1}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={tab.disabled}
            className={cn(
              tabVariants({ variant, size, active: isActive }),
              fullWidth && 'flex-1',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              tabClassName
            )}
          >
            {tab.icon && <span aria-hidden="true" className="flex-shrink-0">{tab.icon}</span>}
            {compact && tab.shortLabel ? (
              <span>{tab.shortLabel}</span>
            ) : (
              <span>{tab.label}</span>
            )}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-medium tracking-[0.04em] rounded-full',
                  isActive
                    ? 'bg-[var(--hm-brand-500)] text-white'
                    : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                )}
                style={{ fontFamily: 'var(--hm-font-mono)' }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Animated 2px brand-500 underline for default & underline variants */}
      {(variant === 'default' || variant === 'underline') && (
        <div
          aria-hidden="true"
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
  /** Must match the Tabs `groupId` so ARIA ids line up between tab and panel. */
  groupId?: string;
}

/**
 * Tab panel content wrapper
 */
export function TabPanel({
  children,
  tabId: tabIdProp,
  activeTab,
  className,
  groupId = 'tabs',
}: TabPanelProps) {
  if (tabIdProp !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={panelId(groupId, tabIdProp)}
      aria-labelledby={tabId(groupId, tabIdProp)}
      tabIndex={0}
      className={cn('animate-fade-in focus:outline-none', className)}
    >
      {children}
    </div>
  );
}

export default Tabs;
