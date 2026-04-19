'use client';

import { cn } from '@/lib/utils';
import { BadgeCheck, Star, Sparkles, Clock, AlertTriangle, CheckCircle, Zap, XCircle, CornerUpLeft } from 'lucide-react';
import { ACCENT_COLOR } from '@/constants/theme';

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
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
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
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-500)]',
    icon: BadgeCheck,
    labelEn: 'Verified',
    labelKa: 'დადასტურებული',
  },
  topRated: {
    bgClass: 'bg-[var(--hm-warning-50)]',
    textClass: 'text-[var(--hm-warning-500)]',
    icon: Star,
    labelEn: 'Top Rated',
    labelKa: 'საუკეთესო',
  },
  new: {
    bgClass: 'bg-[var(--hm-info-50)]',
    textClass: 'text-[var(--hm-info-500)]',
    icon: Sparkles,
    labelEn: 'New',
    labelKa: 'ახალი',
  },
  urgent: {
    bgClass: 'bg-[var(--hm-error-50)]',
    textClass: 'text-[var(--hm-error-500)]',
    icon: AlertTriangle,
    labelEn: 'Urgent',
    labelKa: 'სასწრაფო',
  },
  applied: {
    bgClass: 'bg-[var(--hm-info-50)]',
    textClass: 'text-[var(--hm-info-600)]',
    icon: CheckCircle,
    labelEn: 'Applied',
    labelKa: 'გაგზავნილი',
  },
  premium: {
    bgClass: 'bg-[var(--hm-brand-50)]',
    textClass: 'text-[var(--hm-brand-700)]',
    icon: Zap,
    labelEn: 'Premium',
    labelKa: 'პრემიუმ',
  },
  featured: {
    bgClass: 'bg-[var(--hm-brand-50)]',
    textClass: 'text-[var(--hm-brand-600)]',
    icon: Star,
    labelEn: 'Featured',
    labelKa: 'გამორჩეული',
  },
  pending: {
    bgClass: 'bg-[var(--hm-warning-50)]',
    textClass: 'text-[var(--hm-warning-500)]',
    icon: Clock,
    labelEn: 'Pending',
    labelKa: 'მოლოდინში',
  },
  completed: {
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-500)]',
    icon: CheckCircle,
    labelEn: 'Completed',
    labelKa: 'დასრულებული',
  },
  accepted: {
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-500)]',
    icon: CheckCircle,
    labelEn: 'Accepted',
    labelKa: 'მიღებული',
  },
  rejected: {
    bgClass: 'bg-[var(--hm-error-50)]',
    textClass: 'text-[var(--hm-error-500)]',
    icon: XCircle,
    labelEn: 'Rejected',
    labelKa: 'უარყოფილი',
  },
  withdrawn: {
    bgClass: 'bg-[var(--hm-bg-tertiary)]',
    textClass: 'text-[var(--hm-fg-secondary)]',
    icon: CornerUpLeft,
    labelEn: 'Withdrawn',
    labelKa: 'გაუქმებული',
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
        backgroundColor: `${ACCENT_COLOR}15`,
        color: ACCENT_COLOR,
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
