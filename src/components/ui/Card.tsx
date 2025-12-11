'use client';

import { ReactNode, forwardRef } from 'react';

type CardVariant = 'default' | 'glass' | 'elevated' | 'outlined' | 'accent';
type CardSize = 'sm' | 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  animate?: boolean;
  accentPosition?: 'top' | 'left' | 'none';
}

const sizeStyles = {
  sm: 'p-3 sm:p-4 rounded-xl',
  md: 'p-4 sm:p-5 rounded-2xl',
  lg: 'p-5 sm:p-6 rounded-2xl sm:rounded-3xl',
};

const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  hover = false,
  animate = false,
  accentPosition = 'none',
}, ref) => {

  const baseClasses = `
    relative
    ${sizeStyles[size]}
    ${onClick ? 'cursor-pointer' : ''}
    ${hover ? 'transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1' : ''}
    ${animate ? 'animate-fade-in' : ''}
  `;

  const variantClasses = {
    // Default: Simple transparent terracotta card
    default: `
      bg-white/60 dark:bg-gray-900/40
      backdrop-blur-sm
      border border-[#D2691E]/10 dark:border-[#CD853F]/15
    `,

    // Glass: Same as default with slightly more blur
    glass: `
      bg-white/60 dark:bg-gray-900/40
      backdrop-blur-md
      border border-[#D2691E]/10 dark:border-[#CD853F]/15
    `,

    // Elevated: Same base with subtle shadow
    elevated: `
      bg-white/60 dark:bg-gray-900/40
      backdrop-blur-sm
      border border-[#D2691E]/10 dark:border-[#CD853F]/15
      shadow-[0_2px_12px_rgba(210,105,30,0.06)]
    `,

    // Outlined: Transparent with border only
    outlined: `
      bg-transparent
      border border-[#D2691E]/15 dark:border-[#CD853F]/20
      hover:border-[#D2691E]/25 dark:hover:border-[#CD853F]/30
      transition-colors duration-200
    `,

    // Accent: Same base with slightly stronger border
    accent: `
      bg-white/60 dark:bg-gray-900/40
      backdrop-blur-sm
      border border-[#D2691E]/15 dark:border-[#CD853F]/20
    `,
  };

  const hoverStyles = hover ? {
    default: 'hover:shadow-[0_4px_16px_rgba(210,105,30,0.08)] hover:border-[#D2691E]/15 dark:hover:border-[#CD853F]/20',
    glass: 'hover:shadow-[0_4px_16px_rgba(210,105,30,0.08)] hover:border-[#D2691E]/15 dark:hover:border-[#CD853F]/20',
    elevated: 'hover:shadow-[0_4px_20px_rgba(210,105,30,0.10)]',
    outlined: '',
    accent: 'hover:shadow-[0_4px_16px_rgba(210,105,30,0.08)] hover:border-[#D2691E]/20 dark:hover:border-[#CD853F]/25',
  } : {};

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${hover ? hoverStyles[variant] : ''}
        ${className}
      `}
    >
      {/* Top accent line - subtle and refined */}
      {accentPosition === 'top' && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-b-full opacity-60"
          style={{
            background: 'linear-gradient(90deg, #D2691E, #CD853F)',
          }}
        />
      )}

      {/* Left accent line - subtle and refined */}
      {accentPosition === 'left' && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-10 rounded-r-full opacity-60"
          style={{
            background: 'linear-gradient(180deg, #D2691E, #CD853F)',
          }}
        />
      )}

      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Header component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export const CardHeader = ({ children, className = '', action }: CardHeaderProps) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <div className="flex items-center gap-2.5">
      <div
        className="h-[2px] w-6 rounded-full opacity-50"
        style={{ background: 'linear-gradient(90deg, #D2691E, #CD853F)' }}
      />
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D2691E]/50 dark:text-[#CD853F]/50">
        {children}
      </h3>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// Card Body component
interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody = ({ children, className = '' }: CardBodyProps) => (
  <div className={className}>
    {children}
  </div>
);

// Card Footer component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

export const CardFooter = ({ children, className = '', bordered = false }: CardFooterProps) => (
  <div className={`
    mt-4 pt-4
    ${bordered ? 'border-t border-[#D2691E]/[0.06] dark:border-[#CD853F]/[0.08]' : ''}
    ${className}
  `}>
    {children}
  </div>
);

// Stat Card - specialized card for statistics display
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: CardVariant;
}

export const StatCard = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = 'glass'
}: StatCardProps) => {
  const trendColors = {
    up: 'text-[#D2691E]',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <Card variant={variant} size="md" hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-1 ${trendColors[trend]}`}>
              {trend === 'up' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-[#D2691E]/[0.06] dark:bg-[#CD853F]/[0.08] text-[#D2691E]/70 dark:text-[#CD853F]/70">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// Feature Card - for highlighting features or services
interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  variant?: CardVariant;
  onClick?: () => void;
}

export const FeatureCard = ({
  title,
  description,
  icon,
  variant = 'default',
  onClick
}: FeatureCardProps) => (
  <Card variant={variant} size="md" hover onClick={onClick}>
    {icon && (
      <div className="w-9 h-9 rounded-lg bg-[#D2691E] dark:bg-[#CD853F] flex items-center justify-center text-white mb-3">
        {icon}
      </div>
    )}
    <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-1.5">
      {title}
    </h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </Card>
);

// Profile Card - for user/professional profiles
interface ProfileCardProps {
  name: string;
  title?: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  price?: string;
  isAvailable?: boolean;
  variant?: CardVariant;
  onClick?: () => void;
}

export const ProfileCard = ({
  name,
  title,
  avatar,
  rating,
  reviewCount,
  location,
  price,
  isAvailable,
  variant = 'glass',
  onClick,
}: ProfileCardProps) => (
  <Card variant={variant} size="md" hover onClick={onClick} accentPosition="top">
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-11 h-11 rounded-full object-cover ring-1 ring-[#D2691E]/10 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
          />
        ) : (
          <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[#D2691E] dark:bg-[#CD853F] text-white font-semibold ring-1 ring-[#D2691E]/10 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
            {name.charAt(0)}
          </div>
        )}
        {isAvailable && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#D2691E]/80 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-800 dark:text-gray-100 truncate">
          {name}
        </h4>
        {title && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {rating && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{rating.toFixed(1)}</span>
              {reviewCount && (
                <span className="text-xs text-gray-400">({reviewCount})</span>
              )}
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {location}
            </div>
          )}
        </div>
      </div>

      {/* Price */}
      {price && (
        <div className="text-right">
          <p className="text-sm font-semibold text-[#D2691E]/80 dark:text-[#CD853F]/80">
            {price}
          </p>
        </div>
      )}
    </div>
  </Card>
);

export default Card;
