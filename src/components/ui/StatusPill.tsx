'use client';

import { cn } from '@/lib/utils';
import { BadgeCheck, Star, Sparkles, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { COMPANY_ACCENT } from '@/constants/theme';

export type StatusPillVariant =
  | 'verified'
  | 'topRated'
  | 'new'
  | 'urgent'
  | 'applied'
  | 'premium'
  | 'featured'
  | 'pending'
  | 'completed'
  | 'homico'; // For Homico-verified work

export type StatusPillSize = 'xs' | 'sm' | 'md';

interface StatusPillProps {
  /** The variant/type of status */
  variant: StatusPillVariant;
  /** Size of the pill */
  size?: StatusPillSize;
  /** Custom label (overrides default) */
  label?: string;
  /** Language locale */
  locale?: 'en' | 'ka' | 'ru';
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Additional class names */
  className?: string;
}

// Size configurations
const sizeConfig: Record<StatusPillSize, {
  pill: string;
  icon: string;
  text: string;
}> = {
  xs: { pill: 'px-1.5 py-0.5 gap-0.5', icon: 'w-2.5 h-2.5', text: 'text-[9px]' },
  sm: { pill: 'px-2 py-0.5 gap-1', icon: 'w-3 h-3', text: 'text-[10px]' },
  md: { pill: 'px-2.5 py-1 gap-1', icon: 'w-3.5 h-3.5', text: 'text-xs' },
};

// Variant configurations
const variantConfig: Record<StatusPillVariant, {
  bgClass: string;
  textClass: string;
  icon: React.ComponentType<{ className?: string }>;
  labelEn: string;
  labelKa: string;
}> = {
  verified: {
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    icon: BadgeCheck,
    labelEn: 'Verified',
    labelKa: 'დადასტურებული',
  },
  topRated: {
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    icon: Star,
    labelEn: 'Top Rated',
    labelKa: 'საუკეთესო',
  },
  new: {
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    textClass: 'text-blue-600 dark:text-blue-400',
    icon: Sparkles,
    labelEn: 'New',
    labelKa: 'ახალი',
  },
  urgent: {
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-600 dark:text-red-400',
    icon: AlertTriangle,
    labelEn: 'Urgent',
    labelKa: 'სასწრაფო',
  },
  applied: {
    bgClass: 'bg-violet-50 dark:bg-violet-900/20',
    textClass: 'text-violet-600 dark:text-violet-400',
    icon: CheckCircle,
    labelEn: 'Applied',
    labelKa: 'გაგზავნილი',
  },
  premium: {
    bgClass: '', // Uses inline style for theme color
    textClass: '',
    icon: Zap,
    labelEn: 'Premium',
    labelKa: 'პრემიუმ',
  },
  featured: {
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
    textClass: 'text-purple-600 dark:text-purple-400',
    icon: Star,
    labelEn: 'Featured',
    labelKa: 'გამორჩეული',
  },
  pending: {
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-yellow-600 dark:text-yellow-500',
    icon: Clock,
    labelEn: 'Pending',
    labelKa: 'მოლოდინში',
  },
  completed: {
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-600 dark:text-green-400',
    icon: CheckCircle,
    labelEn: 'Completed',
    labelKa: 'დასრულებული',
  },
  homico: {
    bgClass: '', // Uses inline style for theme color
    textClass: '',
    icon: BadgeCheck,
    labelEn: 'Homico',
    labelKa: 'Homico',
  },
};

/**
 * Reusable status pill/badge component for various status indicators.
 *
 * @example
 * // Verified badge
 * <StatusPill variant="verified" />
 *
 * // Top rated badge (smaller)
 * <StatusPill variant="topRated" size="xs" />
 *
 * // New badge with Georgian locale
 * <StatusPill variant="new" locale="ka" />
 *
 * // Custom label
 * <StatusPill variant="verified" label="ID Verified" />
 */
export function StatusPill({
  variant,
  size = 'sm',
  label,
  locale = 'en',
  showIcon = true,
  className,
}: StatusPillProps) {
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];
  const Icon = variantStyles.icon;

  const displayLabel = label || (locale === 'ka' ? variantStyles.labelKa : variantStyles.labelEn);

  // Premium and Homico variants use theme colors
  const usesThemeColor = variant === 'premium' || variant === 'homico';
  const themeStyle = usesThemeColor
    ? {
        backgroundColor: `${COMPANY_ACCENT}15`,
        color: COMPANY_ACCENT,
      }
    : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded',
        sizeStyles.pill,
        sizeStyles.text,
        !usesThemeColor && variantStyles.bgClass,
        !usesThemeColor && variantStyles.textClass,
        className
      )}
      style={themeStyle}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizeStyles.icon,
            variant === 'topRated' && 'fill-current'
          )}
        />
      )}
      {displayLabel}
    </span>
  );
}

/**
 * Convenience component for verified status
 */
export function VerifiedBadge({
  locale = 'en',
  size = 'sm',
  className,
}: {
  locale?: 'en' | 'ka' | 'ru';
  size?: StatusPillSize;
  className?: string;
}) {
  return <StatusPill variant="verified" locale={locale} size={size} className={className} />;
}

/**
 * Convenience component for top rated status
 */
export function TopRatedBadge({
  locale = 'en',
  size = 'sm',
  className,
}: {
  locale?: 'en' | 'ka' | 'ru';
  size?: StatusPillSize;
  className?: string;
}) {
  return <StatusPill variant="topRated" locale={locale} size={size} className={className} />;
}

/**
 * Convenience component for "new" status
 */
export function NewBadge({
  locale = 'en',
  size = 'sm',
  className,
}: {
  locale?: 'en' | 'ka' | 'ru';
  size?: StatusPillSize;
  className?: string;
}) {
  return <StatusPill variant="new" locale={locale} size={size} className={className} />;
}

export default StatusPill;
