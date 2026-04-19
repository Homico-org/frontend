'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Homico Design System — Tooltip
 *
 * Ink background (n-900), sharp corners (0 radius), mono caption.
 * Appears on hover/focus with a short delay.
 *
 * Usage:
 *   <Tooltip content="Helpful text">
 *     <button>Hover me</button>
 *   </Tooltip>
 */

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 300,
  className,
}: TooltipProps): React.ReactElement {
  const [visible, setVisible] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const show = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none',
            'px-2.5 py-1.5 text-[11px] font-medium leading-tight whitespace-nowrap',
            'shadow-lg',
            positionClasses[side],
            className,
          )}
          style={{
            backgroundColor: 'var(--hm-n-900)',
            color: 'var(--hm-n-50)',
            fontFamily: 'var(--hm-font-body)',
            animation: 'fade-in 0.15s ease-out',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
