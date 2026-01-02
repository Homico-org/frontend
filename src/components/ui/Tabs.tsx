'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tabsContainerVariants = cva('relative flex', {
  variants: {
    variant: {
      default: 'border-b border-neutral-200 dark:border-neutral-800',
      pills: 'gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl',
      underline: 'gap-1',
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
        default: 'px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
        pills: 'px-4 py-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
        underline: 'px-4 py-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
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
        className: 'text-[#C4735B]',
      },
      {
        variant: 'pills',
        active: true,
        className: 'bg-white dark:bg-neutral-900 text-[#C4735B] shadow-sm',
      },
      {
        variant: 'underline',
        active: true,
        className: 'text-[#C4735B]',
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

    if (activeTabRef && variant === 'default') {
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
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span
              className={cn(
                'flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-semibold',
                activeTab === tab.id
                  ? 'bg-[#C4735B] text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}

      {/* Animated underline indicator for default variant */}
      {variant === 'default' && (
        <div
          className="absolute bottom-0 h-0.5 bg-[#C4735B] transition-all duration-300 ease-out"
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
