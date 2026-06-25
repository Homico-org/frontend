'use client';

import { cn } from '@/lib/utils';
import { BadgeCheck, Star, Plus, Clock, AlertTriangle, CheckCircle, Zap, XCircle, CornerUpLeft, Moon, Award, Crown, Handshake, Gem } from 'lucide-react';
import { ACCENT_COLOR } from '@/constants/theme';

export type StatusPillVariant =
  | 'verified'
  | 'topRated'
  | 'experienced'
  | 'new'
  | 'urgent'
  | 'applied'
  | 'premium'
  | 'featured'
  | 'topQuality' // Admin-granted quality badge (best photos/description/portfolio)
  | 'pending'
  | 'completed'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'away' // Pro toggled themselves Away; SLA-exempt + grey pill in browse
  | 'homico' // For Homico-verified work
  | 'homicoPartner'; // Signed Homico contract; the only bookable pros

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
  /**
   * Render as an icon-only circular chip (label moves to a hover tooltip).
   * A quiet, monochrome trust-row treatment - no colored pill, no text.
   */
  iconOnly?: boolean;
  /**
   * Icon-only chips: enable the hover pop + label tooltip. Off on dense /
   * clipped surfaces (e.g. cards with overflow-hidden) where a popped tooltip
   * gets cut and overlaps content. Default on.
   */
  tooltip?: boolean;
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
  experienced: {
    bgClass: 'bg-[var(--hm-info-50)]',
    textClass: 'text-[var(--hm-info-600)]',
    icon: Award,
    labelEn: 'Experienced',
    labelKa: 'გამოცდილი',
  },
  new: {
    bgClass: 'bg-[var(--hm-info-50)]',
    textClass: 'text-[var(--hm-info-500)]',
    icon: Plus,
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
    icon: Crown,
    labelEn: 'Featured',
    labelKa: 'გამორჩეული',
  },
  topQuality: {
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-600)]',
    icon: Gem,
    labelEn: 'Top Quality',
    labelKa: 'ტოპ ხარისხი',
  },
  homicoPartner: {
    // Solid brand fill - the premier badge; it's the only bookable status.
    bgClass: 'bg-[var(--hm-brand-500)]',
    textClass: 'text-white',
    icon: Handshake,
    labelEn: 'Homico Partner',
    labelKa: 'Homico პარტნიორი',
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
  away: {
    // Calm neutral - greys the card slightly without screaming "broken".
    // Distinct from `withdrawn` (which is a final-state thing).
    bgClass: 'bg-[var(--hm-bg-tertiary)]',
    textClass: 'text-[var(--hm-fg-secondary)]',
    icon: Moon,
    labelEn: 'Away',
    labelKa: 'მიუწვდომელი',
  },
  homico: {
    bgClass: '', // Uses inline style for theme color
    textClass: '',
    icon: BadgeCheck,
    labelEn: 'Homico',
    labelKa: 'Homico',
  },
};

// Short "what it is" descriptions for the trust badges, surfaced in the native
// hover title of the icon-only chip — works even on overflow-hidden cards where
// the floating CSS tooltip gets clipped. Only the pro trust badges need one.
const DESCRIPTIONS: Partial<
  Record<StatusPillVariant, { en: string; ka: string }>
> = {
  verified: {
    en: 'Identity checked by Homico',
    ka: 'ვინაობა დადასტურებულია Homico-ს მიერ',
  },
  topRated: {
    en: '4.8★ or higher with 5+ reviews',
    ka: '4.8★ ან მეტი, 5+ შეფასებით',
  },
  experienced: {
    en: '10+ jobs completed on Homico',
    ka: '10+ დასრულებული სამუშაო Homico-ზე',
  },
  new: { en: 'New to Homico', ka: 'ახალი Homico-ზე' },
  premium: { en: 'Premium member', ka: 'პრემიუმ წევრი' },
  featured: { en: 'Hand-picked by Homico', ka: 'შერჩეული Homico-ს მიერ' },
  topQuality: {
    en: 'Top-quality profile — verified by Homico',
    ka: 'მაღალი ხარისხის პროფილი — დადასტურებული Homico-ს მიერ',
  },
  homicoPartner: {
    en: 'Contracted partner — directly bookable',
    ka: 'კონტრაქტორი პარტნიორი — პირდაპირ დაჯავშნადი',
  },
};

// Saturated fill colour per variant for the icon-only chip treatment. Each
// trust badge gets a distinct hue (Featured vermillion, Premium violet, so the
// two no longer both read warm). Tokens where they exist; a literal violet for
// premium since the palette has no violet token.
const SOLID_FILL: Partial<Record<StatusPillVariant, string>> = {
  homicoPartner: 'var(--hm-brand-500)',
  featured: 'var(--hm-brand-500)',
  verified: 'var(--hm-success-500)',
  topRated: 'var(--hm-warning-500)',
  experienced: 'var(--hm-info-500)',
  premium: '#7C3AED',
  // Teal — distinct from verified's green and premium's violet, reads as a
  // calm "quality" hue.
  topQuality: '#0D9488',
  new: 'var(--hm-info-500)',
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
  iconOnly = false,
  tooltip = true,
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

  // Icon-only chip: a solid-fill circular badge with a white glyph, one
  // distinct hue per badge. Small (24px) so a row of them reads as a colourful
  // trust signal without shouting (design-system 4.7 - badges complement).
  if (iconOnly) {
    const chip =
      size === 'xs' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-7 h-7';
    const glyph =
      size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
    const fill = SOLID_FILL[variant];
    // Native browser tooltip: "Label — what it is". Always set (even when the
    // animated CSS tooltip is off) so hovering a badge explains it on any
    // surface, including overflow-hidden cards.
    const desc = DESCRIPTIONS[variant];
    const titleText = desc
      ? `${displayLabel} — ${locale === 'ka' ? desc.ka : desc.en}`
      : displayLabel;
    return (
      <span
        aria-label={displayLabel}
        title={titleText}
        role="img"
        className={cn(
          'relative inline-flex items-center justify-center rounded-full text-white ring-1 ring-inset ring-white/15',
          chip,
          !fill && 'bg-[var(--hm-fg-muted)]',
          // Hover: pop + lift, brighten fill + ring. Named group (`group/badge`)
          // so the tooltip reacts ONLY to hovering this chip, not an ancestor
          // card that also uses `group`. Off when tooltip is disabled (dense /
          // clipped surfaces), where the chip stays static.
          tooltip &&
            'group/badge transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-125 hover:brightness-110 hover:ring-white/40',
          className
        )}
        style={fill ? { backgroundColor: fill } : undefined}
      >
        <Icon
          className={cn(glyph, variant === 'topRated' && 'fill-current')}
        />
        {tooltip && (
          /* Hover tooltip - the label, animated in above the chip. */
          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-[var(--hm-fg-primary)] px-2 py-1 text-[10px] font-medium text-[var(--hm-bg-elevated)] opacity-0 shadow-sm transition-all duration-150 ease-out group-hover/badge:translate-y-0 group-hover/badge:opacity-100">
            {displayLabel}
          </span>
        )}
      </span>
    );
  }

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
