import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { LoadingSpinner } from "./LoadingSpinner"

/**
 * Homico Design System — Button
 *
 * Pill-shaped (border-radius: 9999px). Primary on vermillion brand.
 * Sizes: sm=32px, md=40px, lg=48px, xl=54px
 * Focus: 3px brand-100 ring
 * Press: scale(0.98) 80ms
 * Hover: 180ms ease-standard
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium border border-transparent transition-all focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:bg-[var(--hm-bg-tertiary)] disabled:text-[var(--hm-fg-muted)] disabled:border-[var(--hm-border)] disabled:shadow-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--hm-brand-500)] text-white shadow-[0_4px_14px_rgba(239,78,36,0.25)] hover:bg-[var(--hm-brand-600)] hover:shadow-[0_6px_20px_rgba(239,78,36,0.35)] focus-visible:ring-[var(--hm-brand-100)]",
        secondary:
          "bg-[var(--hm-n-800)] text-[var(--hm-n-50)] hover:bg-[var(--hm-n-700)] focus-visible:ring-[var(--hm-n-300)]",
        outline:
          "border border-[var(--hm-border-strong)] bg-[var(--hm-bg-elevated)] text-[var(--hm-fg-primary)] hover:bg-[var(--hm-bg-tertiary)] focus-visible:ring-[var(--hm-brand-100)]",
        ghost:
          "text-[var(--hm-fg-secondary)] bg-transparent hover:bg-[var(--hm-bg-tertiary)] hover:text-[var(--hm-fg-primary)] focus-visible:ring-[var(--hm-brand-100)]",
        destructive:
          "bg-[var(--hm-error-500)] text-white hover:bg-[var(--hm-error-600)] focus-visible:ring-[var(--hm-error-100)]",
        link:
          "text-[var(--hm-brand-500)] underline-offset-4 hover:underline focus-visible:ring-[var(--hm-brand-100)] p-0 h-auto",
        premium:
          "bg-gradient-to-r from-[var(--hm-brand-400)] via-[var(--hm-brand-500)] to-[var(--hm-brand-400)] bg-[length:200%_100%] text-white shadow-[0_4px_14px_rgba(239,78,36,0.3)] hover:shadow-[0_6px_20px_rgba(239,78,36,0.4)] focus-visible:ring-[var(--hm-brand-100)] animate-gradient-shimmer",
        success:
          "bg-[var(--hm-success-500)] text-white hover:brightness-110 focus-visible:ring-[var(--hm-success-100)]",
      },
      size: {
        default: "h-10 px-[18px] text-[14px] [&_svg]:size-4",
        sm: "h-8 px-[14px] text-[13px] [&_svg]:size-3.5",
        lg: "h-12 px-6 text-[15px] font-semibold [&_svg]:size-[18px]",
        xl: "h-[52px] px-[22px] text-[15px] font-semibold [&_svg]:size-5",
        icon: "h-10 w-10 p-0 [&_svg]:size-[18px]",
        "icon-sm": "h-[36px] w-[36px] p-0 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 p-0 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        style={{ transitionDuration: 'var(--hm-dur-base)', transitionTimingFunction: 'var(--hm-ease-standard)' }}
        {...props}
      >
        {loading ? (
          <>
            <span aria-hidden="true">
              <LoadingSpinner size="sm" />
            </span>
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
