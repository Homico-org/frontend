'use client';

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
const inputVariants = cva(
  "flex w-full rounded-xl text-[var(--color-text-primary)] transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/15",
        filled:
          "bg-[var(--color-bg-tertiary)] border border-transparent focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/15",
        ghost:
          "bg-transparent border-b border-[var(--color-border-subtle)] rounded-none focus:outline-none focus:border-[#E07B4F]",
        premium:
          "bg-gradient-to-r from-[var(--color-bg-primary)] to-[#E07B4F]/5 border border-[#E07B4F]/20 focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/20 focus:shadow-lg focus:shadow-[#E07B4F]/10",
      },
      inputSize: {
        sm: "h-9 px-3 py-2 text-xs",
        default: "h-11 px-4 py-2.5 text-sm",
        lg: "h-12 px-5 py-3 text-base",
        xl: "h-14 px-6 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, leftIcon, rightIcon, error, success, min, onChange, ...props }, ref) => {
    // Hide number spinners when rightIcon is present to prevent overlap
    const hideSpinners = type === 'number' && rightIcon;

    // For number inputs, default min to 0 to prevent negative values
    const numberMin = type === 'number' ? (min !== undefined ? Number(min) : 0) : undefined;

    // Handle change to prevent negative values for number inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        const value = e.target.value;
        // Allow empty string for clearing
        if (value === '') {
          onChange?.(e);
          return;
        }
        // Prevent negative values
        const numValue = parseFloat(value);
        const minValue = numberMin ?? 0;
        if (!isNaN(numValue) && numValue < minValue) {
          e.target.value = String(minValue);
        }
      }
      onChange?.(e);
    };

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          min={numberMin}
          className={cn(
            inputVariants({ variant, inputSize }),
            leftIcon && "pl-10",
            rightIcon && "pr-12",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
            success && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/15",
            hideSpinners && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// ============================================================================
// Textarea Component
// ============================================================================

const textareaVariants = cva(
  "flex w-full rounded-xl text-[var(--color-text-primary)] transition-all duration-300 placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/15",
        filled:
          "bg-[var(--color-bg-tertiary)] border border-transparent focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/15",
        ghost:
          "bg-transparent border-b border-[var(--color-border-subtle)] rounded-none focus:outline-none focus:border-[#E07B4F]",
        premium:
          "bg-gradient-to-r from-[var(--color-bg-primary)] to-[#E07B4F]/5 border border-[#E07B4F]/20 focus:outline-none focus:border-[#E07B4F] focus:ring-2 focus:ring-[#E07B4F]/20 focus:shadow-lg focus:shadow-[#E07B4F]/10",
      },
      textareaSize: {
        sm: "min-h-[80px] px-3 py-2 text-xs",
        default: "min-h-[100px] px-4 py-3 text-sm",
        lg: "min-h-[120px] px-5 py-4 text-base",
        xl: "min-h-[150px] px-6 py-5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
  success?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, error, success, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          textareaVariants({ variant, textareaSize }),
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/15",
          success && "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/15",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

// ============================================================================
// Label Component
// ============================================================================

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
  hint?: string;
  locale?: 'en' | 'ka' | 'ru';
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, optional, hint, locale = 'en', ...props }, ref) => {
    const requiredText = locale === 'ka' ? '*' : '*';
    const optionalText = locale === 'ka' ? 'არასავალდებულო' : 'optional';
    
    return (
      <div className="flex items-center justify-between mb-2">
        <label
          ref={ref}
          className={cn(
            "text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2",
            className
          )}
          {...props}
        >
          {children}
          {required && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {requiredText}
            </span>
          )}
          {optional && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
              {optionalText}
            </span>
          )}
        </label>
        {hint && (
          <span className="text-xs text-[var(--color-text-tertiary)]">{hint}</span>
        )}
      </div>
    )
  }
)
Label.displayName = "Label"

// ============================================================================
// Form Group Component (combines label, input, and helper text)
// ============================================================================

interface FormGroupProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  success?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

const FormGroup = ({
  label,
  required,
  optional,
  hint,
  error,
  success,
  helperText,
  children,
  className,
}: FormGroupProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label required={required} optional={optional} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {(error || success || helperText) && (
        <p className={cn(
          "text-xs",
          error && "text-red-500",
          success && "text-emerald-500",
          !error && !success && "text-[var(--color-text-tertiary)]"
        )}>
          {error || success || helperText}
        </p>
      )}
    </div>
  )
}

export { FormGroup, Input, inputVariants, Label, Textarea, textareaVariants };

