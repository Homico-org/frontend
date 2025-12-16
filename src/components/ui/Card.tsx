'use client';

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ============================================================================
// Base Card Component (shadcn-style with CVA)
// ============================================================================

const cardVariants = cva(
  "rounded-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-[#E07B4F]/10 dark:border-[#E8956A]/15",
        elevated:
          "bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-[#E07B4F]/10 dark:border-[#E8956A]/15 shadow-[0_2px_12px_rgba(210,105,30,0.06)] hover:shadow-[0_4px_20px_rgba(210,105,30,0.10)]",
        glass:
          "bg-white/70 dark:bg-[#323236]/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg",
        outlined:
          "bg-transparent border border-[#E07B4F]/15 dark:border-[#E8956A]/20 hover:border-[#E07B4F]/25 dark:hover:border-[#E8956A]/30",
        accent:
          "bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-[#E07B4F]/15 dark:border-[#E8956A]/20",
        premium:
          "bg-gradient-to-br from-white/80 to-[#E07B4F]/5 dark:from-[#323236]/80 dark:to-[#E07B4F]/10 backdrop-blur-xl border border-[#E07B4F]/15 shadow-lg shadow-[#E07B4F]/5 hover:shadow-xl hover:shadow-[#E07B4F]/10 hover:border-[#E07B4F]/25",
        interactive:
          "bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm border border-[#E07B4F]/10 dark:border-[#E8956A]/15 cursor-pointer hover:border-[#E07B4F]/25 hover:shadow-lg hover:shadow-[#E07B4F]/5 hover:-translate-y-1 active:translate-y-0",
        feature:
          "bg-gradient-to-br from-[#E07B4F]/5 to-[#E8956A]/10 border border-[#E07B4F]/15 hover:border-[#E07B4F]/25 hover:from-[#E07B4F]/10 hover:to-[#E8956A]/15",
      },
      size: {
        sm: "p-3 sm:p-4",
        md: "p-4 sm:p-5",
        lg: "p-5 sm:p-6",
        xl: "p-6 sm:p-8",
      },
      hover: {
        true: "hover:scale-[1.02] hover:-translate-y-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      hover: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  accentPosition?: 'top' | 'left' | 'none';
  animate?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, accentPosition = 'none', animate = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, size, hover }),
        animate && "animate-fade-in",
        "relative",
        className
      )}
      {...props}
    >
      {/* Top accent line */}
      {accentPosition === 'top' && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-b-full opacity-60"
          style={{
            background: 'linear-gradient(90deg, #E07B4F, #E8956A)',
          }}
        />
      )}

      {/* Left accent line */}
      {accentPosition === 'left' && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-10 rounded-r-full opacity-60"
          style={{
            background: 'linear-gradient(180deg, #E07B4F, #E8956A)',
          }}
        />
      )}

      {children}
    </div>
  )
)
Card.displayName = "Card"

// ============================================================================
// Card Sub-components
// ============================================================================

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { action?: React.ReactNode }
>(({ className, action, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between mb-4", className)}
    {...props}
  >
    <div className="flex items-center gap-2.5">
      <div
        className="h-[2px] w-6 rounded-full opacity-50"
        style={{ background: 'linear-gradient(90deg, #E07B4F, #E8956A)' }}
      />
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E07B4F]/50 dark:text-[#E8956A]/50">
        {children}
      </h3>
    </div>
    {action && <div>{action}</div>}
  </div>
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-text-secondary)] leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardBody.displayName = "CardBody"

const CardContent = CardBody // Alias for shadcn compatibility

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { bordered?: boolean }
>(({ className, bordered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-4 pt-4",
      bordered && "border-t border-[#E07B4F]/[0.06] dark:border-[#E8956A]/[0.08]",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// ============================================================================
// Specialized Card Components
// ============================================================================

// Stat Card - for statistics display
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: VariantProps<typeof cardVariants>['variant'];
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = 'premium',
  className,
  ...props
}, ref) => {
  const trendColors = {
    up: 'text-[#E07B4F]',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  return (
    <Card ref={ref} variant={variant} hover className={cn("group text-center", className)} {...props}>
      {icon && (
        <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-gradient-to-br from-[#E07B4F]/10 to-[#E8956A]/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-[#E07B4F]/10">
          <div className="text-[#E07B4F]">
            {icon}
          </div>
        </div>
      )}
      <div className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">{value}</div>
      <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{label}</div>
      {trend && trendValue && (
        <div className={cn("flex items-center justify-center gap-1 mt-2", trendColors[trend])}>
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
    </Card>
  );
})
StatCard.displayName = "StatCard"

// Feature Card - for highlighting features or services
interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: VariantProps<typeof cardVariants>['variant'];
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(({
  title,
  description,
  icon,
  variant = 'feature',
  className,
  onClick,
  ...props
}, ref) => (
  <Card ref={ref} variant={variant} hover className={cn("group", className)} onClick={onClick} {...props}>
    {icon && (
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E07B4F] to-[#D26B3F] flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#E07B4F]/25">
        {icon}
      </div>
    )}
    <h4 className="font-semibold text-[var(--color-text-primary)] mb-1.5 group-hover:text-[#E07B4F] transition-colors">
      {title}
    </h4>
    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
      {description}
    </p>
  </Card>
))
FeatureCard.displayName = "FeatureCard"

// Profile Card - for user/professional profiles
interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  title?: string;
  avatar?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  price?: string;
  isAvailable?: boolean;
  variant?: VariantProps<typeof cardVariants>['variant'];
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(({
  name,
  title,
  avatar,
  rating,
  reviewCount,
  location,
  price,
  isAvailable,
  variant = 'glass',
  className,
  onClick,
  ...props
}, ref) => (
  <Card ref={ref} variant={variant} hover accentPosition="top" className={className} onClick={onClick} {...props}>
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-[#E07B4F]/10 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
          />
        ) : (
          <div className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-[#E07B4F] to-[#D26B3F] text-white font-semibold ring-2 ring-[#E07B4F]/10 ring-offset-2 ring-offset-white dark:ring-offset-gray-900">
            {name.charAt(0)}
          </div>
        )}
        {isAvailable && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[var(--color-text-primary)] truncate">
          {name}
        </h4>
        {title && (
          <p className="text-xs text-[var(--color-text-secondary)] truncate">
            {title}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {rating !== undefined && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium text-[var(--color-text-primary)]">{rating.toFixed(1)}</span>
              {reviewCount !== undefined && (
                <span className="text-xs text-[var(--color-text-tertiary)]">({reviewCount})</span>
              )}
            </div>
          )}
          {location && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
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
          <p className="text-sm font-bold text-[#E07B4F]">
            {price}
          </p>
        </div>
      )}
    </div>
  </Card>
))
ProfileCard.displayName = "ProfileCard"

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardContent,
  CardFooter,
  StatCard,
  FeatureCard,
  ProfileCard,
  cardVariants,
}

export default Card
