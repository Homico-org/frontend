'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface ButtonGroupItem {
  key: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface ButtonGroupProps {
  items: ButtonGroupItem[];
  activeKey: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pills' | 'minimal';
  fullWidth?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    button: 'px-1.5 sm:px-5 py-1.5 sm:py-3 text-[9px] sm:text-sm gap-0.5 sm:gap-2',
    iconSize: 'w-3 h-3 sm:w-4 sm:h-4',
    container: 'rounded-lg sm:rounded-2xl',
  },
  md: {
    button: 'px-1.5 sm:px-8 py-2 sm:py-4 text-[9px] sm:text-base gap-0.5 sm:gap-2.5',
    iconSize: 'w-3 h-3 sm:w-5 sm:h-5',
    container: 'rounded-lg sm:rounded-2xl',
  },
  lg: {
    button: 'px-2 sm:px-10 py-2 sm:py-5 text-[10px] sm:text-lg gap-1 sm:gap-3',
    iconSize: 'w-3.5 h-3.5 sm:w-6 sm:h-6',
    container: 'rounded-lg sm:rounded-3xl',
  },
};

export default function ButtonGroup({
  items,
  activeKey,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  className = '',
}: ButtonGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  // Calculate indicator position based on active button
  useEffect(() => {
    const updateIndicator = () => {
      const activeButton = buttonRefs.current.get(activeKey);
      const container = containerRef.current;

      if (activeButton && container) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();

        // Calculate center position for the underline (40% width of button)
        const indicatorWidth = buttonRect.width * 0.4;
        const centerOffset = (buttonRect.width - indicatorWidth) / 2;

        setIndicatorStyle({
          left: buttonRect.left - containerRect.left + centerOffset,
          width: indicatorWidth,
        });
      }
    };

    updateIndicator();

    // Update on resize for responsive changes
    window.addEventListener('resize', updateIndicator);

    // Small delay to enable smooth initial animation
    const timer = setTimeout(() => setMounted(true), 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeKey, items]);

  const styles = sizeStyles[size];

  const renderButton = (item: ButtonGroupItem) => {
    const isActive = activeKey === item.key;
    const isDisabled = item.disabled;

    const buttonClasses = `
      relative z-10 flex items-center justify-center font-medium
      transition-all duration-200 ease-out
      ${styles.button}
      ${fullWidth ? 'flex-1' : ''}
      ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      ${isActive
        ? 'text-[var(--color-accent)]'
        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
      }
      touch-manipulation whitespace-nowrap
    `;

    const content = (
      <>
        {item.icon && (
          <span
            className={`
              ${styles.iconSize} flex-shrink-0
              transition-transform duration-200
              ${isActive ? 'scale-105' : 'group-hover:scale-105'}
            `}
          >
            {item.icon}
          </span>
        )}
        <span className="relative font-medium">
          {item.label}
        </span>
      </>
    );

    const setRef = (el: HTMLElement | null) => {
      if (el) {
        buttonRefs.current.set(item.key, el);
      }
    };

    if (item.href && !isDisabled) {
      return (
        <Link
          key={item.key}
          href={item.href}
          ref={setRef as React.Ref<HTMLAnchorElement>}
          className={`group ${buttonClasses}`}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        ref={setRef as React.Ref<HTMLButtonElement>}
        onClick={isDisabled ? undefined : item.onClick}
        disabled={isDisabled}
        className={`group ${buttonClasses}`}
        type="button"
      >
        {content}
      </button>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`
        relative inline-flex items-center
        ${styles.container}
        bg-[var(--color-bg-secondary)]
        border border-[var(--color-border)]
        shadow-sm
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Sliding underline indicator */}
      <div
        className={`
          absolute z-0 bottom-0 h-[3px] rounded-full
          ${mounted ? 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]' : ''}
        `}
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          backgroundColor: 'var(--color-accent)',
        }}
      />

      {/* Buttons */}
      {items.map((item) => (
        <div key={item.key} className={fullWidth ? 'flex-1' : ''}>
          {renderButton(item)}
        </div>
      ))}
    </div>
  );
}
