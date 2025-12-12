'use client';

import { ReactNode, forwardRef } from 'react';
import Link from 'next/link';

// ============================================================================
// CARD DESIGN SYSTEM - Warm Terracotta Elegance
// ============================================================================
// A unified card system with consistent aesthetics across all card types.
// Uses warm cream/terracotta gradients with subtle textures and refined shadows.
// ============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'outlined';
  hover?: boolean | 'lift' | 'glow' | 'scale';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
  href?: string;
  onClick?: () => void;
}

// Base card styles - the foundation for all card variants
const baseStyles = `
  relative rounded-2xl overflow-hidden
  transition-all duration-300 ease-out
`;

// Variant styles with sophisticated gradients
const variantStyles = {
  default: `
    bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0]/95 to-[#FDF5E6]/90
    dark:from-[#1c1917] dark:via-[#1a1614]/95 dark:to-[#15120f]/90
    border border-[#E8D5C4]/60 dark:border-[#3d2f24]/60
    shadow-[0_2px_8px_-2px_rgba(210,105,30,0.08),0_4px_16px_-4px_rgba(139,69,19,0.06)]
    dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_4px_16px_-4px_rgba(0,0,0,0.2)]
  `,
  elevated: `
    bg-gradient-to-br from-[#FFFDF9]/95 via-[#FFF9F0]/90 to-[#FDF5E6]/85
    dark:from-[#1f1b18]/95 dark:via-[#1c1815]/90 dark:to-[#171311]/85
    border-2 border-[#D2691E]/25 dark:border-[#CD853F]/25
    shadow-[0_4px_12px_-2px_rgba(210,105,30,0.12),0_8px_24px_-6px_rgba(139,69,19,0.1)]
    dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_8px_24px_-6px_rgba(0,0,0,0.3)]
    backdrop-blur-sm
  `,
  subtle: `
    bg-gradient-to-br from-[#FDFBF7]/80 via-[#FAF6F0]/70 to-[#F5EFE6]/60
    dark:from-[#1a1715]/80 dark:via-[#171412]/70 dark:to-[#14110e]/60
    border border-[#E8D5C4]/30 dark:border-[#3d2f24]/30
    shadow-[0_1px_4px_-1px_rgba(210,105,30,0.05)]
    dark:shadow-[0_1px_4px_-1px_rgba(0,0,0,0.2)]
  `,
  outlined: `
    bg-transparent
    border-2 border-[#D2691E]/15 dark:border-[#CD853F]/20
    hover:border-[#D2691E]/30 dark:hover:border-[#CD853F]/35
  `,
};

// Hover effect styles
const hoverStyles = {
  none: '',
  lift: `
    hover:-translate-y-1 hover:shadow-[0_8px_20px_-4px_rgba(210,105,30,0.2),0_12px_32px_-8px_rgba(139,69,19,0.15)]
    dark:hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5),0_12px_32px_-8px_rgba(0,0,0,0.4)]
    hover:border-[#D2691E]/50 dark:hover:border-[#CD853F]/50
  `,
  glow: `
    hover:shadow-[0_0_0_1px_rgba(210,105,30,0.1),0_4px_16px_-2px_rgba(210,105,30,0.2),0_8px_24px_-4px_rgba(139,69,19,0.15)]
    dark:hover:shadow-[0_0_0_1px_rgba(205,133,63,0.15),0_4px_16px_-2px_rgba(205,133,63,0.2),0_8px_24px_-4px_rgba(139,69,19,0.25)]
    hover:border-[#D2691E]/30 dark:hover:border-[#CD853F]/40
  `,
  scale: `
    hover:scale-[1.02] hover:shadow-[0_6px_16px_-3px_rgba(210,105,30,0.12),0_10px_28px_-6px_rgba(139,69,19,0.1)]
    dark:hover:shadow-[0_6px_16px_-3px_rgba(0,0,0,0.4),0_10px_28px_-6px_rgba(0,0,0,0.3)]
  `,
  true: `
    hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-3px_rgba(210,105,30,0.12),0_10px_28px_-6px_rgba(139,69,19,0.1)]
    dark:hover:shadow-[0_6px_16px_-3px_rgba(0,0,0,0.4),0_10px_28px_-6px_rgba(0,0,0,0.3)]
    hover:border-[#D2691E]/20 dark:hover:border-[#CD853F]/30
  `,
};

// Padding styles
const paddingStyles = {
  none: '',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  variant = 'default',
  hover = true,
  padding = 'none',
  as: Component = 'div',
  href,
  onClick,
}, ref) => {
  const hoverKey = hover === true ? 'true' : hover === false ? 'none' : hover;

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${hoverStyles[hoverKey]}
    ${paddingStyles[padding]}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  // If href is provided, wrap in Link
  if (href) {
    return (
      <Link href={href} className={`block ${combinedClassName}`}>
        {children}
      </Link>
    );
  }

  return (
    <Component
      ref={ref as any}
      className={combinedClassName}
      onClick={onClick}
    >
      {children}
    </Component>
  );
});

Card.displayName = 'Card';

export default Card;

// ============================================================================
// CARD SUBCOMPONENTS
// ============================================================================

// Card Image Section - for hero images with optional overlay
interface CardImageProps {
  children: ReactNode;
  className?: string;
  aspectRatio?: '1/1' | '4/3' | '16/10' | '16/9' | '3/2' | '2/1';
  overlay?: 'none' | 'gradient' | 'dark' | 'light';
}

export function CardImage({
  children,
  className = '',
  aspectRatio = '16/10',
  overlay = 'none'
}: CardImageProps) {
  const overlayStyles = {
    none: '',
    gradient: 'after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/60 after:via-black/20 after:to-transparent',
    dark: 'after:absolute after:inset-0 after:bg-black/40',
    light: 'after:absolute after:inset-0 after:bg-white/20',
  };

  return (
    <div
      className={`relative overflow-hidden ${overlayStyles[overlay]} ${className}`}
      style={{ aspectRatio }}
    >
      {children}
    </div>
  );
}

// Card Content Section
interface CardContentProps {
  children: ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'relaxed';
}

export function CardContent({
  children,
  className = '',
  spacing = 'normal'
}: CardContentProps) {
  const spacingStyles = {
    tight: 'p-3',
    normal: 'p-4',
    relaxed: 'p-5 sm:p-6',
  };

  return (
    <div className={`${spacingStyles[spacing]} ${className}`}>
      {children}
    </div>
  );
}

// Card Header - for title and actions row
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({
  children,
  className = ''
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}

// Card Footer - separated section at bottom
interface CardFooterProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
}

export function CardFooter({
  children,
  className = '',
  border = true
}: CardFooterProps) {
  return (
    <div className={`
      px-4 py-3
      ${border ? 'border-t border-[#E8D5C4]/40 dark:border-[#3d2f24]/40' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Card Badge - floating badge on cards
interface CardBadgeProps {
  children: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  variant?: 'solid' | 'glass' | 'outline';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export function CardBadge({
  children,
  position = 'top-right',
  variant = 'glass',
  color = 'primary',
  className = ''
}: CardBadgeProps) {
  const positionStyles = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };

  const variantColorStyles = {
    solid: {
      primary: 'bg-[#D2691E] text-white',
      success: 'bg-emerald-500 text-white',
      warning: 'bg-amber-500 text-white',
      danger: 'bg-red-500 text-white',
      neutral: 'bg-neutral-700 dark:bg-neutral-600 text-white',
    },
    glass: {
      primary: 'bg-white/90 dark:bg-gray-900/90 text-[#D2691E] border border-[#D2691E]/10',
      success: 'bg-white/90 dark:bg-gray-900/90 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10',
      warning: 'bg-white/90 dark:bg-gray-900/90 text-amber-600 dark:text-amber-400 border border-amber-500/10',
      danger: 'bg-white/90 dark:bg-gray-900/90 text-red-600 dark:text-red-400 border border-red-500/10',
      neutral: 'bg-white/90 dark:bg-gray-900/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700',
    },
    outline: {
      primary: 'bg-transparent border-2 border-[#D2691E] text-[#D2691E]',
      success: 'bg-transparent border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400',
      warning: 'bg-transparent border-2 border-amber-500 text-amber-600 dark:text-amber-400',
      danger: 'bg-transparent border-2 border-red-500 text-red-600 dark:text-red-400',
      neutral: 'bg-transparent border-2 border-neutral-400 text-neutral-600 dark:text-neutral-400',
    },
  };

  return (
    <div className={`
      absolute ${positionStyles[position]} z-20
      px-2.5 py-1 rounded-lg backdrop-blur-sm
      text-xs font-semibold
      ${variantColorStyles[variant][color]}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Card Meta - for metadata row (location, date, etc.)
interface CardMetaProps {
  children: ReactNode;
  className?: string;
}

export function CardMeta({
  children,
  className = ''
}: CardMetaProps) {
  return (
    <div className={`
      flex items-center gap-3 flex-wrap
      text-xs text-[var(--color-text-tertiary)]
      ${className}
    `}>
      {children}
    </div>
  );
}

// Card Meta Item
interface CardMetaItemProps {
  icon?: ReactNode;
  children: ReactNode;
  highlight?: boolean;
}

export function CardMetaItem({
  icon,
  children,
  highlight = false
}: CardMetaItemProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5
      ${highlight ? 'text-[#D2691E] font-medium' : ''}
    `}>
      {icon && <span className="opacity-60">{icon}</span>}
      {children}
    </span>
  );
}

// Card Actions - action buttons container
interface CardActionsProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export function CardActions({
  children,
  className = '',
  align = 'right'
}: CardActionsProps) {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={`flex items-center gap-2 ${alignStyles[align]} ${className}`}>
      {children}
    </div>
  );
}

// Card Title
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  truncate?: boolean | number;
}

export function CardTitle({
  children,
  className = '',
  size = 'md',
  truncate = false
}: CardTitleProps) {
  const sizeStyles = {
    sm: 'text-sm font-medium',
    md: 'text-[15px] font-semibold',
    lg: 'text-lg font-bold',
  };

  const truncateClass = truncate === true
    ? 'truncate'
    : typeof truncate === 'number'
      ? `line-clamp-${truncate}`
      : '';

  return (
    <h3 className={`
      leading-snug
      text-[var(--color-text-primary)]
      group-hover:text-[#D2691E] transition-colors
      ${sizeStyles[size]}
      ${truncateClass}
      ${className}
    `}>
      {children}
    </h3>
  );
}

// Card Description
interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
  lines?: 1 | 2 | 3;
}

export function CardDescription({
  children,
  className = '',
  lines = 2
}: CardDescriptionProps) {
  return (
    <p className={`
      text-sm leading-relaxed
      text-[var(--color-text-tertiary)]
      line-clamp-${lines}
      ${className}
    `}>
      {children}
    </p>
  );
}

// Card Tags - for category tags
interface CardTagsProps {
  tags: string[];
  max?: number;
  className?: string;
}

export function CardTags({
  tags,
  max = 3,
  className = ''
}: CardTagsProps) {
  const visibleTags = tags.slice(0, max);
  const remaining = tags.length - max;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visibleTags.map((tag, i) => (
        <span
          key={i}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#D2691E]/10 text-[#D2691E]"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="px-2 py-1 text-xs text-[var(--color-text-tertiary)]">
          +{remaining}
        </span>
      )}
    </div>
  );
}
