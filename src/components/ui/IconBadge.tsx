'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ACCENT_COLOR, COMPANY_ACCENT, STATUS_COLORS } from '@/constants/theme';

export type IconBadgeVariant =
  | 'accent'
  | 'company'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'whatsapp'
  | 'telegram';

export type IconBadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconBadgeProps {
  /** Icon component to render */
  icon: LucideIcon;
  /** Color variant */
  variant?: IconBadgeVariant;
  /** Size of the badge */
  size?: IconBadgeSize;
  /** Custom color (overrides variant) */
  color?: string;
  /** Whether to show as solid filled or light background */
  filled?: boolean;
  /** Additional class names */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

// Size configurations
const sizeConfig: Record<IconBadgeSize, { container: string; icon: string }> = {
  xs: { container: 'w-6 h-6', icon: 'w-3 h-3' },
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6' },
  xl: { container: 'w-16 h-16', icon: 'w-8 h-8' },
};

// Variant color configurations
const variantColors: Record<IconBadgeVariant, string> = {
  accent: ACCENT_COLOR,
  company: COMPANY_ACCENT,
  success: STATUS_COLORS.success,
  warning: STATUS_COLORS.warning,
  error: STATUS_COLORS.error,
  info: STATUS_COLORS.info,
  neutral: '#71717A', // zinc-500
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  whatsapp: '#25D366',
  telegram: '#0088cc',
};

/**
 * Reusable icon badge component with various sizes and color variants.
 *
 * @example
 * // Basic usage
 * <IconBadge icon={Star} variant="accent" />
 *
 * // Filled style
 * <IconBadge icon={Check} variant="success" filled />
 *
 * // Custom size
 * <IconBadge icon={User} variant="company" size="lg" />
 *
 * // Clickable
 * <IconBadge icon={Settings} variant="neutral" onClick={() => {}} />
 */
export function IconBadge({
  icon: Icon,
  variant = 'accent',
  size = 'md',
  color,
  filled = false,
  className,
  onClick,
}: IconBadgeProps) {
  const { container, icon } = sizeConfig[size];
  const baseColor = color || variantColors[variant];

  const isClickable = !!onClick;

  if (filled) {
    return (
      <div
        className={cn(
          container,
          'rounded-full flex items-center justify-center transition-colors',
          isClickable && 'cursor-pointer hover:opacity-90',
          className
        )}
        style={{ backgroundColor: baseColor }}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
      >
        <Icon className={cn(icon, 'text-white')} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        container,
        'rounded-full flex items-center justify-center transition-colors',
        isClickable && 'cursor-pointer',
        className
      )}
      style={{
        backgroundColor: `${baseColor}1A`, // 10% opacity
        color: baseColor,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = `${baseColor}33`; // 20% opacity
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = `${baseColor}1A`;
        }
      }}
      role={isClickable ? 'button' : undefined}
    >
      <Icon className={icon} />
    </div>
  );
}

/**
 * Social icon badge with pre-configured brand colors
 */
export function SocialIconBadge({
  platform,
  icon,
  href,
  size = 'md',
  className,
}: {
  platform: 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'telegram';
  icon: LucideIcon;
  href?: string;
  size?: IconBadgeSize;
  className?: string;
}) {
  const badge = (
    <IconBadge
      icon={icon}
      variant={platform}
      size={size}
      className={className}
      onClick={href ? undefined : undefined}
    />
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {badge}
      </a>
    );
  }

  return badge;
}

export default IconBadge;
