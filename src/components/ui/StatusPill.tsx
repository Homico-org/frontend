'use client';

import { cn } from '@/lib/utils';
import { BadgeCheck, Star, Clock, AlertTriangle, CheckCircle, XCircle, CornerUpLeft, Moon, Award, Crown, Handshake, Gem, Zap, Sprout } from 'lucide-react';
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
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  labelEn: string;
  labelKa: string;
  labelRu: string;
}> = {
  verified: {
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-500)]',
    icon: BadgeCheck,
    labelEn: 'Verified',
    labelKa: 'დადასტურებული',
    labelRu: 'Проверен',
  },
  topRated: {
    bgClass: 'bg-[var(--hm-warning-50)]',
    textClass: 'text-[var(--hm-warning-500)]',
    icon: Star,
    labelEn: 'Top Rated',
    labelKa: 'საუკეთესო',
    labelRu: 'Топ рейтинг',
  },
  experienced: {
    bgClass: 'bg-[var(--hm-info-50)]',
    textClass: 'text-[var(--hm-info-600)]',
    icon: Award,
    labelEn: 'Experienced',
    labelKa: 'გამოცდილი',
    labelRu: 'Опытный',
  },
  new: {
    bgClass: 'bg-[var(--hm-info-50)]',
    textClass: 'text-[var(--hm-info-500)]',
    icon: Sprout,
    labelEn: 'New',
    labelKa: 'ახალი',
    labelRu: 'Новый',
  },
  urgent: {
    bgClass: 'bg-[var(--hm-error-50)]',
    textClass: 'text-[var(--hm-error-500)]',
    icon: AlertTriangle,
    labelEn: 'Urgent',
    labelKa: 'სასწრაფო',
    labelRu: 'Срочно',
  },
  applied: {
    bgClass: 'bg-[var(--hm-info-50)]',
    textClass: 'text-[var(--hm-info-600)]',
    icon: CheckCircle,
    labelEn: 'Applied',
    labelKa: 'გაგზავნილი',
    labelRu: 'Отправлено',
  },
  premium: {
    bgClass: 'bg-[var(--hm-brand-50)]',
    textClass: 'text-[var(--hm-brand-700)]',
    icon: Crown,
    labelEn: 'Premium',
    labelKa: 'პრემიუმ',
    labelRu: 'Премиум',
  },
  featured: {
    bgClass: 'bg-[var(--hm-brand-50)]',
    textClass: 'text-[var(--hm-brand-600)]',
    icon: Zap,
    labelEn: 'Featured',
    labelKa: 'გამორჩეული',
    labelRu: 'Избранный',
  },
  topQuality: {
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-600)]',
    icon: Gem,
    labelEn: 'Top Quality',
    labelKa: 'ტოპ ხარისხი',
    labelRu: 'Высшее качество',
  },
  homicoPartner: {
    // Solid brand fill - the premier badge; it's the only bookable status.
    bgClass: 'bg-[var(--hm-brand-500)]',
    textClass: 'text-white',
    icon: Handshake,
    labelEn: 'Homico Partner',
    labelKa: 'Homico პარტნიორი',
    labelRu: 'Партнёр Homico',
  },
  pending: {
    bgClass: 'bg-[var(--hm-warning-50)]',
    textClass: 'text-[var(--hm-warning-500)]',
    icon: Clock,
    labelEn: 'Pending',
    labelKa: 'მოლოდინში',
    labelRu: 'В ожидании',
  },
  completed: {
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-500)]',
    icon: CheckCircle,
    labelEn: 'Completed',
    labelKa: 'დასრულებული',
    labelRu: 'Завершено',
  },
  accepted: {
    bgClass: 'bg-[var(--hm-success-50)]',
    textClass: 'text-[var(--hm-success-500)]',
    icon: CheckCircle,
    labelEn: 'Accepted',
    labelKa: 'მიღებული',
    labelRu: 'Принято',
  },
  rejected: {
    bgClass: 'bg-[var(--hm-error-50)]',
    textClass: 'text-[var(--hm-error-500)]',
    icon: XCircle,
    labelEn: 'Rejected',
    labelKa: 'უარყოფილი',
    labelRu: 'Отклонено',
  },
  withdrawn: {
    bgClass: 'bg-[var(--hm-bg-tertiary)]',
    textClass: 'text-[var(--hm-fg-secondary)]',
    icon: CornerUpLeft,
    labelEn: 'Withdrawn',
    labelKa: 'გაუქმებული',
    labelRu: 'Отозвано',
  },
  away: {
    // Calm neutral - greys the card slightly without screaming "broken".
    // Distinct from `withdrawn` (which is a final-state thing).
    bgClass: 'bg-[var(--hm-bg-tertiary)]',
    textClass: 'text-[var(--hm-fg-secondary)]',
    icon: Moon,
    labelEn: 'Away',
    labelKa: 'მიუწვდომელი',
    labelRu: 'Недоступен',
  },
  homico: {
    bgClass: '', // Uses inline style for theme color
    textClass: '',
    icon: BadgeCheck,
    labelEn: 'Homico',
    labelKa: 'Homico',
    labelRu: 'Homico',
  },
};

// Short "what it is" descriptions for the trust badges, surfaced in the native
// hover title of the icon-only chip - works even on overflow-hidden cards where
// the floating CSS tooltip gets clipped. Only the pro trust badges need one.
const DESCRIPTIONS: Partial<
  Record<StatusPillVariant, { en: string; ka: string; ru: string }>
> = {
  verified: {
    en: 'Identity checked by Homico',
    ka: 'ვინაობა დადასტურებულია Homico-ს მიერ',
    ru: 'Личность проверена Homico',
  },
  topRated: {
    en: '4.8★ or higher with 5+ reviews',
    ka: '4.8★ ან მეტი, 5+ შეფასებით',
    ru: '4.8★ и выше, 5+ отзывов',
  },
  experienced: {
    en: '10+ jobs completed on Homico',
    ka: '10+ დასრულებული სამუშაო Homico-ზე',
    ru: '10+ выполненных работ на Homico',
  },
  new: { en: 'New to Homico', ka: 'ახალი Homico-ზე', ru: 'Новый на Homico' },
  premium: { en: 'Premium member', ka: 'პრემიუმ წევრი', ru: 'Премиум-участник' },
  featured: {
    en: 'Hand-picked by Homico',
    ka: 'შერჩეული Homico-ს მიერ',
    ru: 'Отобран Homico',
  },
  topQuality: {
    en: 'Top-quality profile - verified by Homico',
    ka: 'მაღალი ხარისხის პროფილი - დადასტურებული Homico-ს მიერ',
    ru: 'Профиль высшего качества - проверен Homico',
  },
  homicoPartner: {
    en: 'Contracted partner - directly bookable',
    ka: 'კონტრაქტორი პარტნიორი - პირდაპირ დაჯავშნადი',
    ru: 'Партнёр по договору - прямое бронирование',
  },
};

// "Engraved hallmark" treatment for the icon-only chips. Instead of a rainbow
// of solid-fill circles (the banned icon-in-tinted-box), every badge is a
// monochrome ink-on-paper struck disc, and the ONLY colour in the whole system
// is vermillion - reserved for the premier (paid / contracted) tier. Hierarchy
// reads at a glance: solid vermillion (Partner) > vermillion outline (Premium)
// > ink hallmark (earned/verified) > grey hairline (New).
type BadgeTier = 'premierSolid' | 'premierOutline' | 'standard' | 'muted';

const BADGE_TIER: Partial<Record<StatusPillVariant, BadgeTier>> = {
  homicoPartner: 'premierSolid',
  premium: 'premierOutline',
  featured: 'standard',
  topQuality: 'standard',
  verified: 'standard',
  topRated: 'standard',
  experienced: 'standard',
  new: 'muted',
};

const TIER_SEAL: Record<BadgeTier, string> = {
  premierSolid:
    'bg-[var(--hm-brand-500)] text-white ring-[var(--hm-brand-600)]',
  premierOutline:
    'bg-[var(--hm-brand-50)] text-[var(--hm-brand-600)] ring-[var(--hm-brand-500)]',
  standard:
    'bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] ring-[var(--hm-border-strong)]',
  muted:
    'bg-[var(--hm-bg-page)] text-[var(--hm-fg-muted)] ring-[var(--hm-border-subtle)]',
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

  const displayLabel =
    label ||
    (locale === 'ka'
      ? variantStyles.labelKa
      : locale === 'ru'
        ? variantStyles.labelRu
        : variantStyles.labelEn);

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
      size === 'xs' ? 'w-5 h-5' : size === 'md' ? 'w-[26px] h-[26px]' : 'w-[22px] h-[22px]';
    const glyph =
      size === 'xs' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-[13px] h-[13px]' : 'w-3 h-3';
    const seal = TIER_SEAL[BADGE_TIER[variant] ?? 'standard'];
    // Native browser tooltip: "Label - what it is". Always set (even when the
    // animated CSS tooltip is off) so hovering a badge explains it on any
    // surface, including overflow-hidden cards.
    const desc = DESCRIPTIONS[variant];
    const titleText = desc
      ? `${displayLabel} - ${locale === 'ka' ? desc.ka : locale === 'ru' ? desc.ru : desc.en}`
      : displayLabel;
    return (
      <span
        aria-label={displayLabel}
        title={titleText}
        role="img"
        className={cn(
          // Engraved hallmark: a struck disc, ink/vermillion glyph, hairline
          // ring. No drop shadow - depth is the ring + ground contrast.
          'relative inline-flex items-center justify-center rounded-full ring-1 ring-inset',
          chip,
          seal,
          // Hover: the seal "presses" - a faint engraved inset, no balloon.
          // Named group so the tooltip reacts ONLY to this chip, not an
          // ancestor card that also uses `group`.
          tooltip &&
            'group/badge transition-shadow duration-200 ease-out hover:shadow-[inset_0_1px_2px_rgba(17,16,13,0.10)]',
          className
        )}
      >
        <Icon className={glyph} strokeWidth={1.5} />
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
