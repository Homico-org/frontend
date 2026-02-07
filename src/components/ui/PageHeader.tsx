'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { IconBadge, IconBadgeVariant, IconBadgeSize } from './IconBadge';

export interface PageHeaderProps {
  /** Title text */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Icon to display (LucideIcon component) */
  icon?: LucideIcon;
  /** Icon badge variant (from IconBadge) */
  iconVariant?: IconBadgeVariant;
  /** Icon badge size */
  iconSize?: IconBadgeSize;
  /** Back link URL */
  backHref?: string;
  /** Back link label */
  backLabel?: string;
  /** Content to render on the right side */
  rightContent?: React.ReactNode;
  /** Children content below the header row */
  children?: React.ReactNode;
  /** Additional container class names */
  className?: string;
  /**
   * Class names for the padding wrapper inside the header.
   * Defaults to the standard page padding used in Tools pages.
   */
  containerClassName?: string;
  /**
   * Class names for the inner width constraint wrapper.
   * Defaults to `mx-auto max-w-4xl`.
   *
   * For embedded contexts (when a parent layout controls width), you can use `max-w-none`.
   */
  contentClassName?: string;
  /** Whether to show border at bottom */
  bordered?: boolean;
  /** Background variant */
  variant?: 'default' | 'transparent';
}

/**
 * Reusable page header component with icon, title, back link, and optional children.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   icon={Database}
 *   iconVariant="accent"
 *   title="Price Database"
 *   subtitle="Market prices for renovation work"
 *   backHref="/tools"
 *   backLabel="Tools"
 *   rightContent={<Badge>Updated: Jan 2026</Badge>}
 * >
 *   <SearchInput placeholder="Search..." />
 * </PageHeader>
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconVariant = 'accent',
  iconSize = 'lg',
  backHref,
  backLabel,
  rightContent,
  children,
  className,
  containerClassName = 'px-4 py-4 sm:px-6 lg:px-8',
  contentClassName = 'mx-auto max-w-4xl',
  bordered = true,
  variant = 'default',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        bordered && 'border-b border-neutral-200 dark:border-neutral-800',
        variant === 'default' && 'bg-white dark:bg-neutral-900',
        variant === 'transparent' && 'bg-transparent',
        className
      )}
    >
      <div className={containerClassName}>
        <div className={contentClassName}>
          {/* Back Link */}
          {backHref && backLabel && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-[#E07B4F] dark:hover:text-[#E8956A] transition-colors group mb-4"
            >
              <ArrowLeft
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                strokeWidth={1.5}
              />
              {backLabel}
            </Link>
          )}

          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              {Icon && (
                <IconBadge icon={Icon} variant={iconVariant} size={iconSize} />
              )}

              {/* Title & Subtitle */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right Content */}
            {rightContent}
          </div>

          {/* Additional Children */}
          {children && <div className="mt-5">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
