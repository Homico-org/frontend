'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleProps {
  /** Header content - always visible */
  header: React.ReactNode;
  /** Collapsible content */
  children: React.ReactNode;
  /** Whether initially expanded */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Additional container class names */
  className?: string;
  /** Additional header class names */
  headerClassName?: string;
  /** Additional content class names */
  contentClassName?: string;
  /** Show chevron indicator */
  showChevron?: boolean;
  /** Disable expand/collapse */
  disabled?: boolean;
}

/**
 * Collapsible component for expandable content sections.
 *
 * @example
 * ```tsx
 * <Collapsible
 *   header={<div>Click to expand</div>}
 *   defaultOpen={false}
 * >
 *   <div>Hidden content</div>
 * </Collapsible>
 * ```
 */
export function Collapsible({
  header,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  headerClassName,
  contentClassName,
  showChevron = true,
  disabled = false,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (disabled) return;

    const newOpen = !isOpen;
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'w-full text-left flex items-center justify-between',
          disabled && 'cursor-default',
          headerClassName
        )}
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">{header}</div>
        {showChevron && (
          <ChevronDown
            className={cn(
              'w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ml-2',
              isOpen && 'rotate-180'
            )}
            strokeWidth={1.5}
          />
        )}
      </button>
      <div
        className={cn(
          'grid transition-all duration-200',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className={contentClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export interface AccordionItem {
  /** Unique identifier */
  id: string;
  /** Header content */
  header: React.ReactNode;
  /** Collapsible content */
  content: React.ReactNode;
  /** Whether disabled */
  disabled?: boolean;
}

export interface AccordionProps {
  /** Array of accordion items */
  items: AccordionItem[];
  /** Allow multiple items open (default: false - only one open at a time) */
  multiple?: boolean;
  /** Initially expanded item IDs */
  defaultExpanded?: string[];
  /** Additional container class names */
  className?: string;
  /** Additional item class names */
  itemClassName?: string;
  /** Additional header class names */
  headerClassName?: string;
  /** Additional content class names */
  contentClassName?: string;
}

/**
 * Accordion component for multiple collapsible sections.
 *
 * @example
 * ```tsx
 * <Accordion
 *   items={[
 *     { id: '1', header: 'Section 1', content: 'Content 1' },
 *     { id: '2', header: 'Section 2', content: 'Content 2' },
 *   ]}
 *   multiple={false}
 * />
 * ```
 */
export function Accordion({
  items,
  multiple = false,
  defaultExpanded = [],
  className,
  itemClassName,
  headerClassName,
  contentClassName,
}: AccordionProps) {
  const [expandedIds, setExpandedIds] = React.useState<string[]>(defaultExpanded);

  const handleOpenChange = (id: string, open: boolean) => {
    if (multiple) {
      setExpandedIds((prev) =>
        open ? [...prev, id] : prev.filter((expandedId) => expandedId !== id)
      );
    } else {
      setExpandedIds(open ? [id] : []);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <Collapsible
          key={item.id}
          header={item.header}
          open={expandedIds.includes(item.id)}
          onOpenChange={(open) => handleOpenChange(item.id, open)}
          disabled={item.disabled}
          className={itemClassName}
          headerClassName={headerClassName}
          contentClassName={contentClassName}
        >
          {item.content}
        </Collapsible>
      ))}
    </div>
  );
}

export default Collapsible;
