import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { LoadingSpinner } from "./LoadingSpinner"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#E07B4F] text-white shadow-lg shadow-[#E07B4F]/25 hover:shadow-xl hover:shadow-[#E07B4F]/35 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#E07B4F]",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:-translate-y-0.5 focus-visible:ring-red-500",
        outline:
          "border-2 border-[#E07B4F]/30 bg-transparent text-[#E07B4F] hover:bg-[#E07B4F]/5 hover:border-[#E07B4F]/50 focus-visible:ring-[#E07B4F] dark:border-[#E07B4F]/40 dark:hover:bg-[#E07B4F]/10",
        secondary:
          "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-subtle)] focus-visible:ring-[var(--color-border)]",
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/5 hover:text-[#E07B4F] focus-visible:ring-[#E07B4F]/50",
        link:
          "text-[#E07B4F] underline-offset-4 hover:underline focus-visible:ring-[#E07B4F]",
        premium:
          "bg-gradient-to-r from-[#E07B4F] via-[#E8956A] to-[#E07B4F] bg-[length:200%_100%] text-white shadow-lg shadow-[#E07B4F]/30 hover:shadow-xl hover:shadow-[#E07B4F]/40 hover:-translate-y-0.5 animate-gradient-shimmer focus-visible:ring-[#E07B4F]",
        success:
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 focus-visible:ring-emerald-500",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 py-2 text-xs rounded-lg",
        lg: "h-12 px-8 py-3 text-base rounded-xl",
        xl: "h-14 px-10 py-4 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
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
    
    // When asChild is true, pass children directly to Slot without wrapping
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
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
        {/* Shine effect overlay for default and premium variants */}
        {(variant === 'default' || variant === 'premium' || variant === 'success') && !loading && (
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
