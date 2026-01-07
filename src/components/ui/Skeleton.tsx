'use client';

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Base skeleton element with pulse animation
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-neutral-100 dark:bg-neutral-800',
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({
  lines = 1,
  className,
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for avatars/circles
 */
export function SkeletonAvatar({
  size = 'md',
  className,
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
  );
}

/**
 * Skeleton for images with aspect ratio
 */
export function SkeletonImage({
  aspect = '4/3',
  className,
}: SkeletonProps & { aspect?: string }) {
  return (
    <Skeleton
      className={cn(className)}
      style={{ aspectRatio: aspect }}
    />
  );
}

/**
 * Skeleton for cards (job cards, pro cards, etc.)
 */
export function SkeletonCard({
  variant = 'default',
  className,
}: SkeletonProps & { variant?: 'default' | 'horizontal' | 'compact' }) {
  if (variant === 'horizontal') {
    return (
      <div
        className={cn(
          'flex gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-pulse',
          className
        )}
      >
        <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse',
          className
        )}
      >
        <div className="flex gap-3 p-3">
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Default card skeleton
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse',
        className
      )}
    >
      <SkeletonImage aspect="4/3" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards
 */
export function SkeletonCardGrid({
  count = 6,
  columns = 4,
  variant = 'default',
  className,
}: SkeletonProps & {
  count?: number;
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'horizontal' | 'compact';
}) {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {[...Array(count)].map((_, i) => (
        <SkeletonCard
          key={i}
          variant={variant}
          style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for professional cards (compact style)
 */
export function SkeletonProCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse',
        className
      )}
    >
      {/* Top section */}
      <div className="flex gap-3 p-3">
        {/* Avatar skeleton */}
        <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
        {/* Info skeleton */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
        {/* Like button skeleton */}
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      </div>
      {/* Bottom section */}
      <div className="px-3 pb-3 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of professional skeleton cards
 */
export function SkeletonProCardGrid({
  count = 8,
  columns = 4,
  className,
}: SkeletonProps & { count?: number; columns?: 2 | 3 | 4 }) {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {[...Array(count)].map((_, i) => (
        <SkeletonProCard
          key={i}
          style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for list items
 */
export function SkeletonListItem({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-pulse',
        className
      )}
    >
      <SkeletonAvatar size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTableRow({
  columns = 4,
  className,
}: SkeletonProps & { columns?: number }) {
  return (
    <tr className={cn('animate-pulse', className)}>
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default Skeleton;
